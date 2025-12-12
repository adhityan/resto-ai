# Current Reservation Flow Documentation

This document provides a comprehensive overview of all existing logic, nuances, and edge cases handled in the reservation system. The system consists of two main services:

1. **ZenchefService** (`apps/backend/src/modules/zenchef/zenchef.service.ts`) - Low-level Zenchef API integration
2. **ReservationsService** (`apps/backend/src/modules/reservations/reservations.service.ts`) - Business logic layer wrapping ZenchefService

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Configuration](#api-configuration)
3. [Status Mapping](#status-mapping)
4. [Availability Flow](#availability-flow)
5. [Search Reservations Flow](#search-reservations-flow)
6. [Create Reservation Flow](#create-reservation-flow)
7. [Update Reservation Flow](#update-reservation-flow)
8. [Cancel Reservation Flow](#cancel-reservation-flow)
9. [Get Reservation Flow](#get-reservation-flow)
10. [Seating Area Management](#seating-area-management)
11. [Phone Number Handling](#phone-number-handling)
12. [Error Handling](#error-handling)
13. [Caching Strategy](#caching-strategy)
14. [Database Synchronization](#database-synchronization)
15. [LLM Description Generation](#llm-description-generation)

---

## Architecture Overview

```
┌─────────────────────────────┐
│     ReservationsService     │  ← Business logic, validation, DB sync
│  (reservations.service.ts)  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│       ZenchefService        │  ← API integration, data transformation
│    (zenchef.service.ts)     │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Zenchef API (V1/V2)    │  ← External reservation system
└─────────────────────────────┘
```

### Key Contracts/Models

| Model | Purpose |
|-------|---------|
| `AvailabilityResponseModel` | Availability check response with slots, offers, seating areas |
| `BookingObjectModel` | Complete booking details after create/update |
| `ReservationItemModel` | Summary of a reservation for search results |
| `SeatingAreaInfoModel` | Seating area details (ID, name, capacity) |
| `TimeSlotModel` | Time slot with available seating areas |
| `OfferModel` | Special offer/menu details |
| `NextAvailableDateModel` | Fallback date when requested date unavailable |

---

## API Configuration

### ZenchefService Configuration

```typescript
// Environment variables
ZENCHEF_API_BASE_URL_V1  // Base URL for V1 API (bookings)
ZENCHEF_API_BASE_URL_V2  // Base URL for V2 API (availabilities, shifts)
ZENCHEF_PUBLISHER_NAME   // Publisher identifier for booking creation
```

### Headers Built for Requests

```typescript
// Standard headers
{
    "Content-Type": "application/json",
    "auth-token": apiToken,
    "restaurantId": zenchefId,
}

// Additional headers for create/cancel (includePublisher = true)
{
    "PublisherName": this.publisherName,
    "PublisherModelId": randomUUID(),  // Unique per request
}
```

---

## Status Mapping

### Zenchef Status → Human Readable

| Zenchef Status | Human Readable | Description |
|----------------|----------------|-------------|
| `waiting` | "Waiting for confirmation" | Pending restaurant approval |
| `waiting_customer` | "Waiting for customer feedback" | Awaiting customer response |
| `confirmed` | "Confirmed" | Reservation confirmed |
| `canceled` | "Canceled" | Reservation cancelled |
| `refused` | "Refused" | Restaurant declined reservation |
| `arrived` | "Customer arrived" | Guest has arrived |
| `seated` | "Seated" | Guest is currently seated |
| `over` | "Completed" | Reservation completed |
| `no_shown` | "No show" | Guest did not arrive |

### Zenchef Status → Database Enum (ReservationStatus)

```typescript
const statusMap: Record<string, ReservationStatus> = {
    waiting: ReservationStatus.WAITING,
    waiting_customer: ReservationStatus.WAITING_CUSTOMER,
    confirmed: ReservationStatus.CONFIRMED,
    canceled: ReservationStatus.CANCELED,
    refused: ReservationStatus.REFUSED,
    arrived: ReservationStatus.ARRIVED,
    seated: ReservationStatus.SEATED,
    over: ReservationStatus.OVER,
    no_shown: ReservationStatus.NO_SHOWN,
};
```

### Unchangeable Statuses

Reservations with these statuses **cannot** be modified or cancelled:
- `canceled`
- `refused`
- `over`
- `no_shown`

Additionally, reservations for **past dates** cannot be modified or cancelled.

---

## Availability Flow

### Entry Point: `ReservationsService.checkAvailability()`

**Parameters:**
- `restaurantId` - Internal restaurant UUID
- `date` - ISO format YYYY-MM-DD
- `numberOfPeople` - Guest count
- `time` (optional) - HH:MM format for specific time check

### Step 1: Manager Escalation Check

```typescript
if (numberOfPeople >= maxSeatingAllowedBeforeEscalation) {
    // Return special response requiring manager contact
    // No API call made - early return
}
```

**Behavior:** Large party sizes (configured per restaurant via `maxSeatingAllowedBeforeEscalation`) require manager escalation. The system returns a special message instructing the caller/LLM to have the customer contact the restaurant manager directly.

### Step 2: Fetch Seating Areas from Database

```typescript
const allSeatingAreas = await this.restaurantService.getSeatingAreasByRestaurantId(restaurantId);
```

**Important:** Seating areas are pre-synced from Zenchef to local DB. The DB stores both our internal UUID and the Zenchef `roomId` for mapping.

### Step 3: Zenchef API Call (V2)

```http
GET /restaurants/{zenchefId}/availabilities
  ?date-begin={date}
  &date-end={date}
  &with=possible_guests|capacity|occupation
```

### Step 4: Process Availability Response

#### 4a. No Data for Requested Date
If `response.data.data[0]` is undefined:
- Calls `findNextAvailableDate()` to search next 30 days
- Returns availability for future date

#### 4b. Process Shifts and Slots

For each shift and its slots:

```typescript
// Slot is available if:
!slot.closed &&
!slot.marked_as_full &&
slot.possible_guests.includes(numberOfPeople)
```

**Room Filtering Logic:**
```typescript
// Get rooms available for this party size
const roomIds = slot.available_rooms[numberOfPeople.toString()] || [];

// Map to database seating areas - ONLY include if found in our DB
const mappedRooms = this.mapRoomIdsToSeatingAreas(roomIds, restaurantSeatingAreas);
if (mappedRooms.length === 0) continue;  // Skip slot if no valid rooms
```

**Key Nuance:** Slots are only included if they have at least one seating area that exists in the local database.

#### 4c. Check Requested Time Availability

If `time` parameter provided:
- Check if the specific time slot is available
- Record available room IDs for that specific time
- Set `isRequestedSlotAvailable` accordingly

#### 4d. Extract Offers

```typescript
// Offers filtered by:
!offer.is_private &&
numberOfPeople >= offer.config.min_pax_available &&
numberOfPeople <= offer.config.max_pax_available
```

**Deduplication:** Offers are stored in a Map by ID to avoid duplicates across shifts.

#### 4e. Handle No Availability

If no slots available:
1. Check for waiting list availability (`shift.waitlist_total > 0`)
2. If waiting list exists, return empty slots but don't search for next date
3. If no waiting list, search next 30 days for availability

### Step 5: Find Next Available Date

```typescript
private async findNextAvailableDate(
    zenchefId, apiToken, startDate, numberOfPeople, 
    restaurantSeatingAreas, isRequestedSlotAvailable?
)
```

**Logic:**
- Searches in 30-day batches (API allows max 40 days per call)
- Uses `possible_guests` param only (lighter query)
- Returns first date with a slot that has mapped seating areas
- If nothing found in 30 days, returns null

### Step 6: Build LLM Description

Structured format with sections:
1. **Header:** Basic request info
2. **Requested Time Status:** Available/Not Available (if time specified)
3. **Seating Options:** Available rooms for requested time
4. **Available Offers:** Matching offers for party size
5. **Other Available Times:** Alternative slots on same day
6. **Next Available Date:** Fallback date info
7. **Important Notes:** Usage instructions for seating area IDs

---

## Search Reservations Flow

### Entry Point: `ReservationsService.searchReservations()`

**Parameters:**
- `restaurantId` - Required
- `phone` - Optional
- `email` - Optional
- `date` - Optional (YYYY-MM-DD)
- `customerName` - Optional (for fuzzy search)

### Case 1: No Filters Provided

Returns cached booking IDs from in-memory cache:

```typescript
if (!phone && !email && !date && !customerName) {
    const cachedBookingIds = this.bookingIdCache.get(restaurantId);
    // Fetch full details for each cached ID
}
```

**Cache Details:**
- 24-hour TTL (`CacheUtil<Set<string>>(86400)`)
- Stores booking IDs per restaurant
- Populated when searches find results

### Case 2: With Filters

**Phone Normalization:**
```typescript
const normalizedPhone = phone ? normalizePhoneNumber(phone) : undefined;
```

### Zenchef API Call (V1)

```http
GET /bookings?{filters}&limit=100&page=1
```

**Filter Structure:**
```typescript
filters[0][field]=reservation_type
filters[0][operator]==
filters[0][value]=reservation

// Additional filters appended dynamically:
filters[n][field]=phone_number|email|day
filters[n][operator]==
filters[n][value]=<value>
```

### Fuzzy Name Search

If `customerName` provided, uses Fuse.js:

```typescript
const fuse = new Fuse(bookingsWithFullName, {
    keys: ["fullName", "firstname", "lastname"],
    threshold: 0.4,  // 40% tolerance for typos
    includeScore: true,
});
```

**Note:** Fuzzy search is applied AFTER fetching from API (client-side filtering).

### Post-Processing: `mapToReservationItems()`

1. **Date Filtering:** Excludes reservations older than 1 week
2. **Status Priority Sorting:**
   - Priority 0: `confirmed`
   - Priority 1: Other statuses
   - Priority 2: `cancelled`
3. **Date Proximity Sorting:** Within each status group, sorted by closeness to today

### Cache Update

```typescript
if (reservations.length > 0) {
    const existingCache = this.bookingIdCache.get(restaurantId) || new Set();
    reservations.forEach((res) => existingCache.add(res.bookingId));
    this.bookingIdCache.set(restaurantId, existingCache);
}
```

### Operation Logging

```typescript
await this.databaseService.operationLog.create({
    data: { type: OperationType.SEARCH_RESERVATION, restaurantId },
});
```

---

## Create Reservation Flow

### Entry Point: `ReservationsService.createReservation()`

**Parameters:**
- `restaurantId` - Required
- `numberOfCustomers` - Required
- `phone` - Required
- `name` - Required
- `date` - Required (YYYY-MM-DD)
- `time` - Required (HH:MM)
- `comments` - Optional
- `email` - Optional
- `roomId` - Optional (internal seating area UUID)
- `allergies` - Optional
- `callId` - Optional (link to call record)

### Step 1: Phone Normalization

```typescript
const normalizedPhone = normalizePhoneNumber(phone);
```

**French Phone Rules:**
- `0612345678` → `+33612345678`
- `+33 6 12 34 56 78` → `+33612345678`
- `06-12-34-56-78` → `+33612345678`

### Step 2: Upsert Customer

```typescript
await this.customerService.upsertCustomer(restaurantId, {
    phone: normalizedPhone,
    name,
    email,
});
```

Customer is identified by `(restaurantId, phone)` composite key.

### Step 3: Room ID Mapping

```typescript
if (roomId) {
    const seatingAreas = await this.restaurantService.getSeatingAreasByRestaurantId(restaurantId);
    const seatingArea = seatingAreas.find((area) => area.id === roomId);
    if (seatingArea) {
        zenchefRoomId = seatingArea.zenchefRoomId;
    }
}
```

**Important:** Maps internal UUID to Zenchef's numeric room ID.

### Step 4: Name Parsing

```typescript
const nameParts = name.trim().split(/\s+/);
const firstname = nameParts[0];
const lastname = nameParts.slice(1).join(" ") || nameParts[0];
```

**Edge Case:** If only one name part, uses it for both first and last name.

### Step 5: Zenchef API Call (V1)

```http
POST /bookings?force=1&with-confirmation=1
```

**Payload:**
```typescript
{
    day: date,
    time: time,
    nb_guests: numberOfCustomers,
    firstname,
    lastname,
    phone_number: phone,
    email: email,
    comment: comments || undefined,
    allergies: allergies || undefined,
    country: "fr",           // Hardcoded to French
    status: "confirmed",     // Auto-confirm
    wish?: {
        booking_room_id: zenchefRoomId  // Optional room preference
    }
}
```

**Query Parameters:**
- `force=1` - Forces creation even with potential conflicts
- `with-confirmation=1` - Sends confirmation to customer

**Publisher Headers:** Included for create requests (see API Configuration).

### Step 6: Sync to Local Database

```typescript
await this.syncReservationToDb(restaurantId, booking.bookingId, {
    status: booking.status,
    date: booking.date,
    time: booking.time,
    numberOfGuests: booking.numberOfCustomers,
    customerName: booking.name,
    customerPhone: booking.phone,
    customerEmail: booking.email,
    comments: booking.comments,
    allergies: allergies,
    seatingAreaName: booking.seatingAreaName,
    callId,
});
```

Uses upsert with composite unique key: `(restaurantId, zenchefBookingId)`.

### Step 7: Operation Logging

```typescript
await this.databaseService.operationLog.create({
    data: { type: OperationType.CREATE_RESERVATION, restaurantId },
});
```

### Error Handling

**400/412 Status Codes:**
```typescript
if (error.response?.status === 400 || error.response?.status === 412) {
    throw new GeneralError(
        `There is no availability for ${date} date and ${time} time anymore`
    );
}
```

---

## Update Reservation Flow

### Entry Point: `ReservationsService.updateReservation()`

**Parameters:**
- `restaurantId` - Required
- `bookingId` - Required (Zenchef booking ID)
- `updates` - Partial object with optional fields:
  - `numberOfCustomers`
  - `phone`
  - `name`
  - `date`
  - `time`
  - `comments`
  - `email`
  - `roomId`
  - `allergies`

### Step 1: Fetch Existing Booking

```typescript
const existingBooking = await this.zenchefService.getBookingById(
    zenchefId, apiToken, bookingId
);
```

### Step 2: Merge Updates with Existing Data

```typescript
const numberOfCustomers = updates.numberOfCustomers ?? existingBooking.nb_guests;
const phone = updates.phone ? normalizePhoneNumber(updates.phone) : existingBooking.phone_number || "";
const name = updates.name ?? `${existingBooking.firstname} ${existingBooking.lastname}`.trim();
// ... etc
```

**Important:** Only provided fields are updated; others retain existing values.

### Step 3: Determine Update Type

**Time-Only Change Detection:**
```typescript
const onlyTimeChanged =
    currentBooking.day === date &&
    currentBooking.nb_guests === numberOfCustomers &&
    currentBooking.firstname === firstname &&
    currentBooking.lastname === lastname &&
    currentBooking.phone_number === phone &&
    currentBooking.email === email &&
    currentBooking.time !== time;
```

### Step 4a: Time-Only Update (Optimized)

```http
PATCH /bookings/{bookingId}/changeTime
```

**Payload:**
```typescript
{
    time: time,
    wish?: { booking_room_id: zenchefRoomId }
}
```

**Why:** Zenchef has a dedicated endpoint for time changes that doesn't require full booking data.

### Step 4b: Full Update

```http
PUT /bookings/{bookingId}?force=1&with-confirmation=1
```

Same payload structure as create.

### Step 5: Sync to Local Database

Same as create flow - upsert with all updated data.

### Step 6: Operation Logging

```typescript
await this.databaseService.operationLog.create({
    data: { type: OperationType.UPDATE_RESERVATION, restaurantId },
});
```

---

## Cancel Reservation Flow

### Entry Point: `ReservationsService.cancelReservation()`

**Parameters:**
- `restaurantId`
- `bookingId`

### Step 1: Zenchef API Call (V1)

```http
PATCH /bookings/{bookingId}/changeStatus
```

**Payload:**
```typescript
{ status: "canceled" }
```

**Publisher Headers:** Included for cancel requests.

### Step 2: Update Local Database

```typescript
await this.databaseService.reservation.updateMany({
    where: {
        restaurantId,
        zenchefBookingId: bookingId,
    },
    data: {
        status: ReservationStatus.CANCELED,
    },
});
```

### Step 3: Operation Logging

```typescript
await this.databaseService.operationLog.create({
    data: { type: OperationType.CANCEL_RESERVATION, restaurantId },
});
```

---

## Get Reservation Flow

### Entry Point: `ReservationsService.getReservationById()`

**Parameters:**
- `restaurantId`
- `bookingId`

### Zenchef API Call (V1)

```http
GET /bookings/{bookingId}
```

### Response Mapping

```typescript
return new BookingObjectModel({
    bookingId: booking.id.toString(),
    numberOfCustomers: booking.nb_guests,
    phone: booking.phone_number || "",
    name: `${booking.firstname} ${booking.lastname}`.trim(),
    date: booking.day,
    time: booking.time,
    comments: booking.comment || undefined,
    email: booking.email || undefined,
    status: booking.status,
    description,
});
```

### canModify/canCancel Calculation (in BookingObjectModel)

```typescript
const unchangeableStatuses = ['canceled', 'refused', 'over', 'no_shown'];
const isUnchangeableStatus = data.status ? unchangeableStatuses.includes(data.status) : false;

const today = new Date();
today.setHours(0, 0, 0, 0);
const reservationDate = new Date(data.date);
reservationDate.setHours(0, 0, 0, 0);
const isPastDate = reservationDate < today;

this.canModify = !isUnchangeableStatus && !isPastDate;
this.canCancel = !isUnchangeableStatus && !isPastDate;
```

---

## Seating Area Management

### Syncing from Zenchef

**Endpoint:**
```http
GET /restaurants/{zenchefId}/shifts (V2)
```

**Collection Logic:**
```typescript
for (const shift of response.data.data) {
    for (const room of shift.rooms) {
        if (!roomsMap.has(room.id)) {
            roomsMap.set(room.id, new SeatingAreaModel({
                id: room.id,
                name: room.name,
                description: room.description,
                max_capacity: room.capacity,
            }));
        }
    }
}
```

**Deduplication:** Uses Map to deduplicate rooms that appear in multiple shifts.

### Database Storage

Seating areas stored with dual IDs:
- `id` - Internal UUID
- `zenchefRoomId` - Zenchef's numeric room ID

### Mapping Functions

**Zenchef Room IDs → SeatingAreaInfoModel:**
```typescript
private mapRoomIdsToSeatingAreas(
    roomIds: number[],
    restaurantSeatingAreas: Array<{
        id: string;
        zenchefRoomId: number;
        name: string;
        description: string | null;
        maxCapacity: number;
    }>
): SeatingAreaInfoModel[] {
    return roomIds
        .map((roomId) => {
            const area = restaurantSeatingAreas.find(
                (a) => a.zenchefRoomId === roomId
            );
            if (!area) return null;  // Skip unknown rooms
            return new SeatingAreaInfoModel({ ... });
        })
        .filter((area) => area !== null);
}
```

---

## Phone Number Handling

### Normalization Function

```typescript
export function normalizePhoneNumber(phoneNumber: string): string {
    // Remove all spaces, dashes, parentheses, and dots
    let normalized = phoneNumber.replace(/[\s\-().]/g, "").trim();

    // French mobile numbers starting with 0 → +33
    if (normalized.startsWith("0")) {
        normalized = "+33" + normalized.substring(1);
    }
    // Already has +33
    else if (normalized.startsWith("+33")) {
        normalized = normalized;
    }
    // Has 33 without + (length >= 11)
    else if (normalized.startsWith("33") && normalized.length >= 11) {
        normalized = "+" + normalized;
    }

    return normalized;
}
```

### Usage Points

1. **searchReservations()** - Normalizes phone before API search
2. **createReservation()** - Normalizes before API call and customer upsert
3. **updateReservation()** - Normalizes if phone is in updates

---

## Error Handling

### Error Message Extraction

```typescript
private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    if (error.response?.data?.errors) {
        return JSON.stringify(error.response.data.errors);
    }
    return error.message || "Unknown error";
}
```

### Specific Error Handling

**Create/Update - Availability Errors (400/412):**
```typescript
if (error.response?.status === 400 || error.response?.status === 412) {
    throw new GeneralError(
        `There is no availability for ${date} date and ${time} time anymore`
    );
}
```

**Search - 404 Handling:**
```typescript
if (error.response?.status === 404) {
    return [];  // Not found = empty results
}
```

---

## Caching Strategy

### Booking ID Cache

```typescript
private readonly bookingIdCache: CacheUtil<Set<string>>;

constructor() {
    this.bookingIdCache = new CacheUtil<Set<string>>(86400);  // 24 hours
}
```

**Structure:** `Map<restaurantId, Set<bookingId>>`

**Population:** 
- Search results add booking IDs to cache
- Empty cache returns empty when no search filters provided

**Usage:**
- No-filter searches return cached IDs then fetch full details

---

## Database Synchronization

### `syncReservationToDb()` Method

```typescript
private async syncReservationToDb(
    restaurantId: string,
    bookingId: string,
    data: {
        status?: string;
        date: string;
        time: string;
        numberOfGuests: number;
        customerName: string;
        customerPhone?: string;
        customerEmail?: string;
        comments?: string;
        allergies?: string;
        seatingAreaName?: string;
        callId?: string;
    }
): Promise<Reservation>
```

**Upsert Strategy:**
- Unique key: `(restaurantId, zenchefBookingId)`
- Creates new record if not exists
- Updates all fields if exists

**Call ID Validation:**
```typescript
if (data.callId) {
    const call = await this.databaseService.call.findUnique({
        where: { id: data.callId },
    });
    if (!call) {
        throw new GeneralError(`Call with id ${data.callId} not found`);
    }
}
```

---

## LLM Description Generation

Each response includes a `description` field optimized for LLM consumption.

### Availability Response Description

Structured sections:
```
AVAILABILITY CHECK: {guests} guests on {date}{ at {time}}

REQUESTED TIME STATUS: AVAILABLE/NOT AVAILABLE at {time}
SEATING OPTIONS FOR {time}:
  1. {room.name} (ID: {room.id}, Capacity: {room.maxCapacity})

AVAILABLE OFFERS ({count} matching your party size):
  1. "{offer.name}" (ID: {offer.id})
     {truncated description}

OTHER AVAILABLE TIMES ON {date} ({count} slots):
  - {time}: {count} seating area(s) [{names}]

NEXT AVAILABLE DATE: {date}
SEATING AREAS ON {date}:
  1. {room.name} (ID: {room.id}, Capacity: {room.maxCapacity})

IMPORTANT NOTES:
- Seating area availability is provided in "availableRoomTypesOnRequestedTime"...
- Use the seating area ID when making a booking...
```

### Create/Update Response Description

```
Successfully created/updated a new reservation.
Booking ID: {bookingId}.
Customer: {name} (phone: {phone}, email: {email}).
Reservation: {count} people on {date} at {time}.
Special requests: {comments}.
Allergies: {allergies}.
```

### Search Response Description

```
Searched for reservations with filters ({filters}) (reservations older than 1 week are not shown).
Found {count} matching reservation(s).
Details: {date} ({people} people, {status}); ...
```

### Manager Escalation Description

```
RESERVATION REQUIRES MANAGER CONTACT

Party Size: {guests} guests
Requested Date: {date}{ at {time}}

IMPORTANT: Reservations for {threshold} or more guests cannot be made through the automated system...
```

---

## Admin UI Methods

### `getReservationsFromDb()`

Paginated database query with filters:
- `restaurantId` (optional)
- `date` (optional)
- `status` (optional array)
- `skip`/`take` for pagination

Includes restaurant data, ordered by date + time descending.

### `getReservationFromDbById()`

Single reservation by internal UUID, includes restaurant name.

### `getReservationFromDbByBookingId()`

Single reservation by Zenchef booking ID using composite key.

---

## Key Nuances Summary

1. **Dual ID System:** Internal UUIDs vs Zenchef numeric IDs for seating areas
2. **Room Filtering:** Slots without known database seating areas are filtered out
3. **French-First:** Phone normalization assumes French format, country hardcoded to "fr"
4. **Time-Only Optimization:** Uses dedicated API for time-only changes
5. **Forced Creation:** Uses `force=1` to push through reservations
6. **Fuzzy Search:** Client-side Fuse.js for name matching (40% tolerance)
7. **1-Week Filter:** Search results exclude reservations older than 7 days
8. **Status-Based Sorting:** Confirmed first, cancelled last
9. **Manager Escalation:** Large parties bypass availability check entirely
10. **Waiting List Detection:** Returns empty slots but doesn't search next date if waiting list exists
11. **Publisher Headers:** Required for create/cancel operations
12. **Cache Population:** Search results populate cache; empty cache returns empty for filter-less search






