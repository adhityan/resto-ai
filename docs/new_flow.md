# New Reservation Flow Documentation

This document provides a comprehensive overview of the proposed changes to the reservation system. It builds upon the existing flow documented in [`current_flow.md`](./current_flow.md) and introduces new validation rules, offer requirements, prepayment handling, and cancellation restrictions.

---

## Table of Contents

1. [Overview](#overview)
2. [Summary of Changes](#summary-of-changes)
3. [Affected Files](#affected-files)
4. [Model Updates](#model-updates)
5. [Zenchef Type Updates](#zenchef-type-updates)
6. [Availability Checking Logic](#availability-checking-logic)
7. [Booking Creation](#booking-creation)
8. [Booking Update](#booking-update)
9. [Get/Search Reservations](#getsearch-reservations)
10. [Complete Example Flows](#complete-example-flows)
11. [Validation Rules Summary](#validation-rules-summary)

---

## Overview

The reservation system integrates with the Zenchef API to manage restaurant bookings. This update introduces several new features:

1. **Enhanced availability validation** - Additional checks for shift fullness, bookable windows, and capacity limits
2. **Prepayment support** - Handle deposits and payment requirements for large parties
3. **Cancellation restrictions** - Inform users when bookings cannot be cancelled
4. **Offer requirements** - Enforce offer selection when shifts require it
5. **Offer details in bookings** - Include selected offer information in booking responses

### Architecture (Unchanged)

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

---

## Summary of Changes

| Area | Change Type | Description |
|------|-------------|-------------|
| SeatingAreaInfoModel | New fields | `paymentRequiredForConfirmation`, `notCancellable` |
| TimeSlotModel | New fields | `isOfferRequired`, `requiredOfferIds` |
| BookingObjectModel | New fields | `offerId`, `offerName`, `offerDescription` |
| ReservationItemModel | New fields | `offerId`, `offerName`, `offerDescription` |
| AvailabilityResponseModel | Modified field | `offers` is now truly optional (undefined when not required) |
| ZenchefBookingData | New fields | `url`, `booking_offers` |
| ZenchefCreateBookingPayload | New fields | `offers` |
| checkAvailability | New validation | Shift fullness, bookable window, capacity bounds, prepayment, cancellation |
| createReservation | New validation | Offer requirement check, prepayment URL logging |
| updateReservation | New validation | Offer requirement check on date/time change |
| getReservationById | Enhancement | Include offer details from booking_offers |
| searchReservations | Enhancement | Include offer details from booking_offers |

---

## Affected Files

### Contract Models (packages/contracts/)

| File | Changes |
|------|---------|
| `src/reservation/models/availability-response.model.ts` | Add fields to SeatingAreaInfoModel, TimeSlotModel |
| `src/reservation/models/booking-object.model.ts` | Add offer fields |
| `src/reservation/models/reservation-item.model.ts` | Add offer fields |

### Backend Types (apps/backend/)

| File | Changes |
|------|---------|
| `src/types/zenchef.ts` | Add booking_offers, url, offers payload types |

### Backend Services (apps/backend/)

| File | Changes |
|------|---------|
| `src/modules/zenchef/zenchef.service.ts` | Update checkAvailability, createReservation, add offer extraction |
| `src/modules/reservations/reservations.service.ts` | Add offer validation, prepayment handling, offer detail extraction |

---

## Model Updates

### SeatingAreaInfoModel

**File:** `packages/contracts/src/reservation/models/availability-response.model.ts`

#### Current Structure

```typescript
export class SeatingAreaInfoModel {
    @ApiProperty({
        description: "Internal seating area ID (UUID)",
        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    })
    id: string;

    @ApiProperty({ description: "Room name", example: "Main Dining Room" })
    name: string;

    @ApiProperty({
        description: "Room description",
        example: "Beautiful main dining area",
        nullable: true,
    })
    description?: string | null;

    @ApiProperty({ description: "Maximum capacity", example: 50 })
    maxCapacity: number;

    constructor(data: {
        id: string;
        name: string;
        description: string | null;
        maxCapacity: number;
    }) {
        this.id = data.id;
        this.name = data.name;
        this.maxCapacity = data.maxCapacity;
        this.description = data.description ?? undefined;
    }
}
```

#### New Fields to Add

```typescript
export class SeatingAreaInfoModel {
    // ... existing fields ...

    @ApiProperty({
        description: "Amount per guest required for prepayment confirmation (in cents/smallest currency unit)",
        example: 5000,
        required: false,
    })
    paymentRequiredForConfirmation?: number;

    @ApiProperty({
        description: "True if this slot cannot be cancelled after booking due to cancellation window",
        example: false,
        required: false,
    })
    notCancellable?: boolean;

    constructor(data: {
        id: string;
        name: string;
        description: string | null;
        maxCapacity: number;
        paymentRequiredForConfirmation?: number;  // NEW
        notCancellable?: boolean;                  // NEW
    }) {
        this.id = data.id;
        this.name = data.name;
        this.maxCapacity = data.maxCapacity;
        this.description = data.description ?? undefined;
        this.paymentRequiredForConfirmation = data.paymentRequiredForConfirmation;  // NEW
        this.notCancellable = data.notCancellable;                                  // NEW
    }
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `paymentRequiredForConfirmation` | `number?` | When set, indicates that a prepayment is required. Value is the charge per guest (in cents). The booking will be marked as PENDING until payment is completed via the email link. |
| `notCancellable` | `boolean?` | When `true`, indicates that the cancellation window has passed and bookings for this slot cannot be cancelled by the end user. |

---

### TimeSlotModel

**File:** `packages/contracts/src/reservation/models/availability-response.model.ts`

#### Current Structure

```typescript
export class TimeSlotModel {
    @ApiProperty({ description: "Time slot", example: "19:00" })
    time: string;

    @ApiProperty({
        description: "Available seating areas for this time slot",
        type: [SeatingAreaInfoModel],
    })
    seatingAreas: SeatingAreaInfoModel[];

    constructor(data: { time: string; seatingAreas: SeatingAreaInfoModel[] }) {
        this.time = data.time;
        this.seatingAreas = data.seatingAreas;
    }
}
```

#### New Fields to Add

```typescript
export class TimeSlotModel {
    @ApiProperty({ description: "Time slot", example: "19:00" })
    time: string;

    @ApiProperty({
        description: "Available seating areas for this time slot",
        type: [SeatingAreaInfoModel],
    })
    seatingAreas: SeatingAreaInfoModel[];

    @ApiProperty({
        description: "Whether an offer must be selected when booking this time slot",
        example: true,
        required: false,
    })
    isOfferRequired?: boolean;

    @ApiProperty({
        description: "IDs of valid offers that can be selected for this slot (only present when isOfferRequired is true)",
        example: [71358, 71359],
        required: false,
    })
    requiredOfferIds?: number[];

    constructor(data: {
        time: string;
        seatingAreas: SeatingAreaInfoModel[];
        isOfferRequired?: boolean;      // NEW
        requiredOfferIds?: number[];    // NEW
    }) {
        this.time = data.time;
        this.seatingAreas = data.seatingAreas;
        this.isOfferRequired = data.isOfferRequired;        // NEW
        this.requiredOfferIds = data.requiredOfferIds;      // NEW
    }
}
```

#### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `isOfferRequired` | `boolean?` | When `true`, an offer must be selected from `requiredOfferIds` when creating a booking for this time slot. |
| `requiredOfferIds` | `number[]?` | Array of valid offer IDs that can be used for this time slot. One must be selected when `isOfferRequired` is true. |

---

### BookingObjectModel

**File:** `packages/contracts/src/reservation/models/booking-object.model.ts`

#### New Fields to Add

```typescript
export class BookingObjectModel {
    // ... existing fields ...

    @ApiProperty({
        description: "ID of the selected offer",
        example: 71358,
        required: false,
    })
    offerId?: number;

    @ApiProperty({
        description: "Name of the selected offer",
        example: "Chef's Heritage Menu",
        required: false,
    })
    offerName?: string;

    @ApiProperty({
        description: "Description of the selected offer",
        example: "A curated 5-course dining experience",
        required: false,
    })
    offerDescription?: string;

    constructor(data: {
        // ... existing params ...
        offerId?: number;           // NEW
        offerName?: string;         // NEW
        offerDescription?: string;  // NEW
    }) {
        // ... existing assignments ...
        this.offerId = data.offerId;                  // NEW
        this.offerName = data.offerName;              // NEW
        this.offerDescription = data.offerDescription; // NEW
    }
}
```

---

### ReservationItemModel

**File:** `packages/contracts/src/reservation/models/reservation-item.model.ts`

#### New Fields to Add

```typescript
export class ReservationItemModel {
    // ... existing fields ...

    @ApiProperty({
        description: "ID of the selected offer",
        example: 71358,
        required: false,
    })
    offerId?: number;

    @ApiProperty({
        description: "Name of the selected offer",
        example: "Chef's Heritage Menu",
        required: false,
    })
    offerName?: string;

    @ApiProperty({
        description: "Description of the selected offer",
        example: "A curated 5-course dining experience",
        required: false,
    })
    offerDescription?: string;

    constructor(data: {
        // ... existing params ...
        offerId?: number;           // NEW
        offerName?: string;         // NEW
        offerDescription?: string;  // NEW
    }) {
        // ... existing assignments ...
        this.offerId = data.offerId;                  // NEW
        this.offerName = data.offerName;              // NEW
        this.offerDescription = data.offerDescription; // NEW
    }
}
```

---

### AvailabilityResponseModel

**File:** `packages/contracts/src/reservation/models/availability-response.model.ts`

#### Modified Field: offers is now truly optional

```typescript
export class AvailabilityResponseModel {
    // ... existing fields ...

    @ApiProperty({
        description:
            "Available offers that match the number of guests. ONLY present when at least one shift has is_offer_required: true. Omitted entirely otherwise.",
        type: [OfferModel],
        required: false,  // CHANGED: Now truly optional
    })
    offers?: OfferModel[];  // CHANGED: Added ? to make optional

    // ... rest of existing fields ...

    constructor(data: {
        isRequestedSlotAvailable?: boolean;
        availableRoomTypesOnRequestedTime?: SeatingAreaInfoModel[];
        otherAvailableSlotsForThatDay: TimeSlotModel[];
        nextAvailableDate: NextAvailableDateModel | null;
        offers?: OfferModel[];  // CHANGED: Now optional
        description: string;
    }) {
        this.isRequestedSlotAvailable = data.isRequestedSlotAvailable;
        this.availableRoomTypesOnRequestedTime = data.availableRoomTypesOnRequestedTime;
        this.otherAvailableSlotsForThatDay = data.otherAvailableSlotsForThatDay;
        this.nextAvailableDate = data.nextAvailableDate;
        this.description = data.description;
        // CHANGED: Only assign if defined (field omitted from JSON when undefined)
        if (data.offers !== undefined) {
            this.offers = data.offers;
        }
    }
}
```

#### Behavioral Change

| Scenario | Old Behavior | New Behavior |
|----------|--------------|--------------|
| No shift has `is_offer_required: true` | `offers: []` (empty array) | `offers` field omitted entirely |
| At least one shift has `is_offer_required: true` | `offers: [...]` (populated) | `offers: [...]` (populated) |

**Rationale:** When offers are not required, the field should not appear in the response at all. This makes it clearer to API consumers that offer selection is not applicable for these time slots.

---

## Zenchef Type Updates

**File:** `apps/backend/src/types/zenchef.ts`

### ZenchefBookingOffer (New Type)

```typescript
/**
 * Represents an offer attached to a booking
 */
export interface ZenchefBookingOffer {
    id: number;
    offer_id: number;
    booking_id: number;
    count: number;
    offer_data: {
        id: number;
        restaurant_id: number;
        name: string;
        position?: number;
        charge_per_guests?: number;
        is_on_first_step?: boolean;
        has_prepayment?: boolean;
        date_from?: string;
        date_to?: string;
        description?: string;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
        deleted_at?: string | null;
    };
    created_at?: string;
    updated_at?: string;
}
```

### ZenchefBookingData Updates

```typescript
export interface ZenchefBookingData {
    // ... existing fields ...
    id: number;
    type: string;
    partner_id: string;
    reservation_type: string;
    restaurant_id: number;
    day: string;
    time: string;
    nb_guests: number;
    firstname: string;
    lastname: string;
    phone_number: string | null;
    email: string | null;
    comment: string | null;
    private_comment: string | null;
    allergies: string | null;
    status: string;
    shift_slot: ZenchefBookingShiftSlot | null;
    customersheet?: ZenchefCustomerSheet;
    created_at: string;
    updated_at: string;
    
    // NEW FIELDS
    /**
     * URL for prepayment/confirmation (used when prepayment is required)
     * Will be null if no prepayment is needed
     */
    url?: string | null;
    
    /**
     * Array of offers attached to this booking
     * Customer can only have ONE offer per booking
     */
    booking_offers?: ZenchefBookingOffer[];
}
```

### ZenchefCreateBookingPayload Updates

```typescript
export interface ZenchefCreateBookingPayload {
    day: string;
    time: string;
    nb_guests: number;
    firstname: string;
    lastname: string;
    phone_number?: string;
    email?: string;
    comment?: string;
    allergies?: string;
    country: string;
    status: string;
    wish?: {
        booking_room_id: number;
    };
    
    // NEW FIELD
    /**
     * Offer selection for this booking
     * Customer can only select ONE offer per reservation
     * Array will contain exactly one item when an offer is selected
     */
    offers?: Array<{
        count: number;      // Number of guests (typically same as nb_guests)
        offer_id: number;   // ID of the selected offer
    }>;
}
```

---

## Availability Checking Logic

### Entry Point

**Method:** `ZenchefService.checkAvailability()`

**Parameters:**
- `zenchefId` - Restaurant Zenchef ID
- `apiToken` - Restaurant API token  
- `date` - Date to check (ISO format YYYY-MM-DD)
- `numberOfPeople` - Number of guests
- `restaurantSeatingAreas` - Seating areas from database
- `time` (optional) - Specific time to check (HH:MM format)

### Validation Rules

#### Rule 1: Shift marked_as_full Check

**Purpose:** Skip shifts that are marked as completely full at the shift level.

**Zenchef Field:** `ZenchefShift.marked_as_full`

**Logic:**

```typescript
for (const shift of dayData.shifts) {
    // NEW: Check if entire shift is marked as full
    if (shift.marked_as_full) {
        this.logger.debug(`Shift ${shift.name} is marked as full, skipping`);
        continue;  // Skip all slots in this shift
    }
    
    for (const slot of shift.shift_slots) {
        // Existing check: slot-level fullness
        if (slot.closed || slot.marked_as_full) {
            continue;
        }
        // ... process slot
    }
}
```

**Impact:** Entire shift is skipped when `marked_as_full` is true, even if individual slots might appear available.

---

#### Rule 2: Bookable Window Validation

**Purpose:** Ensure the current time falls within the allowed booking window for the slot.

**Zenchef Fields:** 
- `ZenchefShiftSlot.bookable_from` (slot level)
- `ZenchefShiftSlot.bookable_to` (slot level)
- `ZenchefShift.bookable_from` (shift level fallback)
- `ZenchefShift.bookable_to` (shift level fallback)

**Logic:**

```typescript
const now = new Date();

for (const slot of shift.shift_slots) {
    // Use slot-level bookable window, fall back to shift-level
    const bookableFrom = slot.bookable_from || shift.bookable_from;
    const bookableTo = slot.bookable_to || shift.bookable_to;
    
    // Check if we're too early to book
    if (bookableFrom) {
        const bookableFromDate = new Date(bookableFrom);
        if (bookableFromDate > now) {
            this.logger.debug(
                `Slot ${slot.name} not yet bookable (opens ${bookableFrom})`
            );
            continue;  // Too early to book this slot
        }
    }
    
    // Check if we're too late to book
    if (bookableTo) {
        const bookableToDate = new Date(bookableTo);
        if (bookableToDate < now) {
            this.logger.debug(
                `Slot ${slot.name} booking window closed (was ${bookableTo})`
            );
            continue;  // Too late to book this slot
        }
    }
    
    // ... slot is within bookable window, continue processing
}
```

**Impact:** Slots outside their bookable window are excluded from availability results.

---

#### Rule 3: Capacity Min/Max Validation

**Purpose:** Ensure the party size falls within the shift's capacity bounds.

**Zenchef Fields:**
- `ZenchefShift.capacity.min`
- `ZenchefShift.capacity.max`

**Logic:**

```typescript
for (const shift of dayData.shifts) {
    const capacity = shift.capacity;
    
    if (capacity) {
        // Check minimum party size
        if (capacity.min !== null && numberOfPeople < capacity.min) {
            this.logger.debug(
                `Party size ${numberOfPeople} below shift ${shift.name} minimum (${capacity.min})`
            );
            continue;  // Skip entire shift - party too small
        }
        
        // Check maximum party size
        if (capacity.max !== null && numberOfPeople > capacity.max) {
            this.logger.debug(
                `Party size ${numberOfPeople} above shift ${shift.name} maximum (${capacity.max})`
            );
            continue;  // Skip entire shift - party too large
        }
    }
    
    // ... process shift slots
}
```

**Impact:** Shifts where the party size falls outside capacity bounds are completely skipped.

---

#### Rule 4: Prepayment Handling

**Purpose:** When prepayment is required based on party size, set `paymentRequiredForConfirmation` on seating areas.

**Zenchef Fields:**
- `ZenchefShift.prepayment_param.min_guests` - Minimum guests before prepayment kicks in
- `ZenchefShift.prepayment_param.charge_per_guests` - Amount per guest (in cents)
- `ZenchefShift.prepayment_param.is_web_booking_askable` - Whether prepayment can be requested

**Logic:**

```typescript
for (const shift of dayData.shifts) {
    const prepayment = shift.prepayment_param;
    let paymentRequiredForConfirmation: number | undefined;
    
    // Determine if prepayment is required for this party size
    if (
        prepayment &&
        prepayment.is_web_booking_askable &&
        numberOfPeople >= prepayment.min_guests
    ) {
        paymentRequiredForConfirmation = prepayment.charge_per_guests;
        this.logger.debug(
            `Prepayment required for ${numberOfPeople} guests: ` +
            `${prepayment.charge_per_guests} per guest`
        );
    }
    
    for (const slot of shift.shift_slots) {
        // ... existing slot processing ...
        
        // When creating SeatingAreaInfoModel, include prepayment info
        const seatingAreaInfo = new SeatingAreaInfoModel({
            id: area.id,
            name: area.name,
            description: area.description,
            maxCapacity: area.maxCapacity,
            paymentRequiredForConfirmation,  // NEW: Include prepayment amount
        });
    }
}
```

**Prepayment Behavior:**
1. When `numberOfPeople >= min_guests`, prepayment is required
2. The reservation status will be set to "waiting" (pending) instead of "confirmed"
3. An email with a payment link is sent to the customer
4. Once payment is completed, the reservation automatically becomes "confirmed"

**Description Text When Prepayment Required:**

```
PREPAYMENT NOTICE:
For parties of {min_guests}+ guests, a prepayment of €{charge_per_guests/100} per person is required.
Total prepayment: €{(charge_per_guests * numberOfPeople) / 100}

How it works:
1. The reservation will be created with status "PENDING"
2. A payment link will be sent to the customer's email address
3. The customer must complete the payment using the link
4. Once payment is received, the reservation is automatically confirmed

Important: Unpaid reservations may be automatically cancelled after a certain period.
```

---

#### Rule 5: Cancellation Restriction Check

**Purpose:** Determine if a booking for this slot would be non-cancellable due to the cancellation window.

**Zenchef Fields:**
- `ZenchefShift.cancelation_param.enduser_cancelable_before` - Seconds before reservation when cancellation is allowed
- `ZenchefShift.cancelation_param.enduser_cancelable_reference` - Reference point (typically "shift")

**Logic:**

```typescript
for (const shift of dayData.shifts) {
    for (const slot of shift.shift_slots) {
        const cancelParam = shift.cancelation_param;
        let notCancellable = false;
        
        if (cancelParam && cancelParam.enduser_cancelable_before) {
            // Calculate the reservation datetime
            const reservationDateTime = new Date(`${date}T${slot.name}:00`);
            
            // Calculate seconds until reservation
            const secondsUntilReservation = 
                (reservationDateTime.getTime() - Date.now()) / 1000;
            
            // If we're within the cancellation window, mark as not cancellable
            if (secondsUntilReservation < cancelParam.enduser_cancelable_before) {
                notCancellable = true;
                this.logger.debug(
                    `Slot ${slot.name} would be non-cancellable ` +
                    `(${secondsUntilReservation}s < ${cancelParam.enduser_cancelable_before}s)`
                );
            }
        }
        
        // When creating SeatingAreaInfoModel, include cancellation restriction
        const seatingAreaInfo = new SeatingAreaInfoModel({
            id: area.id,
            name: area.name,
            description: area.description,
            maxCapacity: area.maxCapacity,
            notCancellable,  // NEW: Include cancellation restriction
        });
    }
}
```

**Example Calculation:**
- Reservation time: 2025-12-05 19:00:00
- Current time: 2025-12-05 17:30:00
- Seconds until reservation: 5400 seconds (1.5 hours)
- enduser_cancelable_before: 7200 seconds (2 hours)
- Result: `notCancellable = true` (5400 < 7200)

**Description Text When Not Cancellable:**

```
CANCELLATION RESTRICTION:
Slots marked with "notCancellable: true" cannot be cancelled by the customer after booking.
This is because the cancellation window ({enduser_cancelable_before/3600} hours before the reservation) has passed.

If you need to cancel a non-cancellable reservation, please contact the restaurant directly.
```

---

#### Rule 6: Offer Requirement Logic (Reworked)

**Purpose:** Extract offers only when `is_offer_required` is true, and map offer IDs to their applicable time slots.

**Zenchef Fields:**
- `ZenchefShift.is_offer_required` - Whether offers are mandatory for this shift
- `ZenchefShift.offer_required_from_pax` - Party size from which offers become mandatory (optional)
- `ZenchefShift.offers` - Array of available offers
- `ZenchefOffer.is_private` - Whether offer is private (should be excluded)
- `ZenchefOffer.config.min_pax_available` - Minimum party size for offer
- `ZenchefOffer.config.max_pax_available` - Maximum party size for offer

**New Helper Interface:**

```typescript
interface OfferExtractionResult {
    /**
     * Array of offers that match the party size criteria
    * Empty if no shift has is_offer_required: true
     */
    offers: OfferModel[];
    
    /**
     * True if at least one shift has is_offer_required: true
     */
    anyOfferRequired: boolean;
    
    /**
     * Map of time slot (HH:MM) to array of valid offer IDs for that slot
     */
    requiredOfferIdsBySlotTime: Map<string, number[]>;
}
```

**Reworked extractOffers Method:**

```typescript
/**
 * Extracts offers from shifts based on is_offer_required flag
 * Only includes offers when at least one shift requires them
 */
private extractOffers(
    shifts: ZenchefShift[],
    numberOfPeople: number
): OfferExtractionResult {
    const offersMap = new Map<number, OfferModel>();
    const requiredOfferIdsBySlotTime = new Map<string, number[]>();
    let anyOfferRequired = false;

    for (const shift of shifts) {
        // KEY CHANGE: Only process offers if is_offer_required is true
        if (!shift.is_offer_required) {
            continue;  // Skip shifts where offers are optional
        }
        
        // Check if offer is required based on party size
        if (
            shift.offer_required_from_pax !== null &&
            shift.offer_required_from_pax !== undefined &&
            numberOfPeople < shift.offer_required_from_pax
        ) {
            continue;  // Party size doesn't require offer
        }
        
        if (!shift.offers || shift.offers.length === 0) {
            continue;  // No offers configured for this shift
        }
        
        anyOfferRequired = true;

        for (const offer of shift.offers) {
            // Filter: must not be private
            if (offer.is_private) {
                continue;
            }
            
            // Filter: party size must be within offer bounds
            if (numberOfPeople < offer.config.min_pax_available) {
                continue;
            }
            if (numberOfPeople > offer.config.max_pax_available) {
                continue;
            }

            // Add to offers map (deduplicate by ID)
            if (!offersMap.has(offer.id)) {
                offersMap.set(
                    offer.id,
                    new OfferModel({
                        id: offer.id,
                        name: offer.name,
                        description: offer.description?.en || "",
                    })
                );
            }

            // Map this offer to all applicable time slots in the shift
            for (const slot of shift.shift_slots) {
                // Skip unavailable slots
                if (slot.closed || slot.marked_as_full) {
                    continue;
                }
                
                const existing = requiredOfferIdsBySlotTime.get(slot.name) || [];
                if (!existing.includes(offer.id)) {
                    existing.push(offer.id);
                    requiredOfferIdsBySlotTime.set(slot.name, existing);
                }
            }
        }
    }

    // KEY RULE: If no shift requires offers, return undefined (field omitted from response)
    return {
        offers: anyOfferRequired ? Array.from(offersMap.values()) : undefined,
        anyOfferRequired,
        requiredOfferIdsBySlotTime,
    };
}
```

**Key Behavioral Changes:**

| Scenario | Old Behavior | New Behavior |
|----------|--------------|--------------|
| All shifts have `is_offer_required: false` | Returns all matching offers | Returns `undefined` (field omitted) |
| At least one shift has `is_offer_required: true` | Returns all matching offers | Returns only offers from required shifts |
| Offer is private | Excluded | Excluded (unchanged) |
| Party size outside offer bounds | Excluded | Excluded (unchanged) |

---

#### Rule 7: TimeSlotModel Population with Offer Requirements

**Purpose:** Include offer requirement flags in TimeSlotModel.

**Logic:**

```typescript
// Extract offers with new logic
const { offers, anyOfferRequired, requiredOfferIdsBySlotTime } = 
    this.extractOffers(shifts, numberOfPeople);

// When building TimeSlotModel for each available slot
for (const [slotTime, roomIdsSet] of availableSlotsMap.entries()) {
    const slotOfferIds = requiredOfferIdsBySlotTime.get(slotTime) || [];
    const isOfferRequiredForSlot = anyOfferRequired && slotOfferIds.length > 0;
    
    const timeSlot = new TimeSlotModel({
        time: slotTime,
        seatingAreas: this.mapRoomIdsToSeatingAreas(
            Array.from(roomIdsSet),
            restaurantSeatingAreas
        ),
        // NEW: Include offer requirement info
        isOfferRequired: isOfferRequiredForSlot || undefined,
        requiredOfferIds: isOfferRequiredForSlot ? slotOfferIds : undefined,
    });
    
    otherAvailableSlotsForThatDay.push(timeSlot);
}
```

**Description Text When Offer Required:**

```
OFFER REQUIREMENT:
Time slots with "isOfferRequired: true" require selecting one offer.

How to book with an offer:
1. Check the "requiredOfferIds" array for the time slot
2. Review the "offers" array in the response to see offer details
3. When creating the reservation, include "offerId" with your chosen offer ID
4. Only ONE offer can be selected per reservation

Example: If requiredOfferIds is [71358, 71359], you must pass offerId: 71358 OR offerId: 71359
```

---

### Updated checkAvailability Return Value

The `AvailabilityResponseModel` now has a truly optional `offers` field (undefined when not required):

```typescript
return new AvailabilityResponseModel({
    isRequestedSlotAvailable,
    availableRoomTypesOnRequestedTime,  // Now includes paymentRequiredForConfirmation, notCancellable
    offers: anyOfferRequired ? offers : undefined,  // TRULY OPTIONAL: undefined when not required
    otherAvailableSlotsForThatDay,       // Now includes isOfferRequired, requiredOfferIds
    nextAvailableDate,
    description,                         // Updated to include new sections
});
```

**Important:** When `anyOfferRequired` is false, the `offers` field should be completely omitted from the response (undefined), not set to an empty array.

### Updated Description Generation

```typescript
private buildAvailabilityDescription(
    date: string,
    numberOfPeople: number,
    time: string | undefined,
    availability: Omit<AvailabilityResponseModel, 'description'>,
    prepaymentInfo?: { minGuests: number; chargePerGuest: number },
    hasNonCancellableSlots: boolean,
    anyOfferRequired: boolean
): string {
    const parts: string[] = [];

    // Header
    parts.push(
        `AVAILABILITY CHECK: ${numberOfPeople} guests on ${date}${time ? ` at ${time}` : ""}`
    );

    // Requested time status (existing logic)
    if (time !== undefined) {
        if (availability.isRequestedSlotAvailable === true) {
            parts.push(`\nREQUESTED TIME STATUS: AVAILABLE at ${time}`);
            // ... existing seating areas output
        } else {
            parts.push(`\nREQUESTED TIME STATUS: NOT AVAILABLE at ${time}`);
        }
    }

    // NEW: Prepayment notice
    if (prepaymentInfo) {
        parts.push(`\nPREPAYMENT NOTICE:`);
        parts.push(
            `For parties of ${prepaymentInfo.minGuests}+ guests, ` +
            `a prepayment of €${prepaymentInfo.chargePerGuest / 100} per person is required.`
        );
        parts.push(
            `Total prepayment: €${(prepaymentInfo.chargePerGuest * numberOfPeople) / 100}`
        );
        parts.push(`After booking, a payment link will be sent to the customer's email.`);
        parts.push(`The reservation will remain PENDING until payment is completed.`);
    }

    // NEW: Cancellation restriction notice
    if (hasNonCancellableSlots) {
        parts.push(`\nCANCELLATION RESTRICTION:`);
        parts.push(
            `Some time slots are marked as "notCancellable: true" in their seating areas.`
        );
        parts.push(
            `Bookings for these slots cannot be cancelled by the customer after creation.`
        );
    }

    // NEW: Offer requirement notice
    if (anyOfferRequired) {
        parts.push(`\nOFFER REQUIREMENT:`);
        parts.push(
            `Some time slots require selecting an offer (isOfferRequired: true).`
        );
        parts.push(`Check the "requiredOfferIds" field for valid offer IDs.`);
        parts.push(`Include "offerId" when creating a reservation for these slots.`);
    }

    // Available offers (only show section if offers exist)
    if (availability.offers && availability.offers.length > 0) {
        parts.push(
            `\nAVAILABLE OFFERS (${availability.offers.length} matching your party size):`
        );
        availability.offers.forEach((offer, idx) => {
            parts.push(`  ${idx + 1}. "${offer.name}" (ID: ${offer.id})`);
            if (offer.description) {
                const desc = offer.description.length > 100
                    ? offer.description.substring(0, 97) + "..."
                    : offer.description;
                parts.push(`     ${desc}`);
            }
        });
    }
    // Note: When anyOfferRequired is false, offers will be undefined and this section is skipped

    // Other available time slots (existing logic)
    if (availability.otherAvailableSlotsForThatDay.length > 0) {
        parts.push(
            `\nOTHER AVAILABLE TIMES ON ${date} (${availability.otherAvailableSlotsForThatDay.length} slots):`
        );
        availability.otherAvailableSlotsForThatDay.forEach((slot) => {
            const seatingList = slot.seatingAreas.length > 0
                ? slot.seatingAreas.map((s) => s.name).join(", ")
                : "No configured seating areas";
            
            let slotInfo = `  - ${slot.time}: ${slot.seatingAreas.length} seating area(s) [${seatingList}]`;
            
            // NEW: Add offer requirement indicator
            if (slot.isOfferRequired) {
                slotInfo += ` [OFFER REQUIRED - IDs: ${slot.requiredOfferIds?.join(", ")}]`;
            }
            
            // NEW: Add prepayment/cancellation indicators
            const hasPayment = slot.seatingAreas.some(s => s.paymentRequiredForConfirmation);
            const hasNonCancel = slot.seatingAreas.some(s => s.notCancellable);
            if (hasPayment) slotInfo += ` [PREPAYMENT]`;
            if (hasNonCancel) slotInfo += ` [NON-CANCELLABLE]`;
            
            parts.push(slotInfo);
        });
    } else {
        parts.push(`\nOTHER AVAILABLE TIMES ON ${date}: None available`);
    }

    // Next available date (existing logic)
    if (availability.nextAvailableDate) {
        parts.push(`\nNEXT AVAILABLE DATE: ${availability.nextAvailableDate.date}`);
        // ... existing output
    }

    // Important notes (updated)
    parts.push(`\nIMPORTANT NOTES:`);
    parts.push(`- Use seating area ID when making a booking to specify preferred room`);
    if (anyOfferRequired) {
        parts.push(`- Include "offerId" for time slots marked with isOfferRequired: true`);
    }
    if (prepaymentInfo) {
        parts.push(`- Bookings with prepayment will be PENDING until payment is completed`);
    }
    if (hasNonCancellableSlots) {
        parts.push(`- Non-cancellable bookings cannot be cancelled by the customer`);
    }

    return parts.join("\n");
}
```

---

## Booking Creation

### Updated Method Signatures

#### ZenchefService.createReservation

```typescript
/**
 * Creates a new reservation
 * @param zenchefId - Restaurant Zenchef ID
 * @param apiToken - Restaurant API token
 * @param numberOfCustomers - Number of guests
 * @param phone - Customer phone number
 * @param name - Customer full name
 * @param date - Reservation date (ISO format YYYY-MM-DD)
 * @param time - Reservation time (HH:MM format)
 * @param comments - Optional comments
 * @param email - Optional customer email
 * @param zenchefRoomId - Optional Zenchef room ID
 * @param allergies - Optional allergies or dietary restrictions
 * @param offerId - Optional offer ID (required when is_offer_required is true)
 * @returns Complete booking object with booking ID
 * @throws GeneralError if booking cannot be created
 */
public async createReservation(
    zenchefId: string,
    apiToken: string,
    numberOfCustomers: number,
    phone: string,
    name: string,
    date: string,
    time: string,
    comments?: string,
    email?: string,
    zenchefRoomId?: number,
    allergies?: string,
    offerId?: number  // NEW PARAMETER
): Promise<Omit<BookingObjectModel, "description">>
```

#### ReservationsService.createReservation

```typescript
/**
 * Creates a new reservation
 * @param restaurantId - Internal restaurant ID
 * @param numberOfCustomers - Number of guests
 * @param phone - Customer phone number
 * @param name - Customer full name
 * @param date - Reservation date (ISO format YYYY-MM-DD)
 * @param time - Reservation time (HH:MM format)
 * @param comments - Optional comments
 * @param email - Optional customer email
 * @param roomId - Optional seating area ID
 * @param allergies - Optional allergies or dietary restrictions
 * @param callId - Optional call ID to associate with the reservation
 * @param offerId - Optional offer ID (required when is_offer_required is true)
 * @returns Complete booking object with booking ID and human-readable description
 */
async createReservation(
    restaurantId: string,
    numberOfCustomers: number,
    phone: string,
    name: string,
    date: string,
    time: string,
    comments?: string,
    email?: string,
    roomId?: string,
    allergies?: string,
    callId?: string,
    offerId?: number  // NEW PARAMETER
): Promise<BookingObjectModel>
```

### Offer Validation Before Booking

```typescript
// In ReservationsService.createReservation

async createReservation(
    restaurantId: string,
    numberOfCustomers: number,
    phone: string,
    name: string,
    date: string,
    time: string,
    comments?: string,
    email?: string,
    roomId?: string,
    allergies?: string,
    callId?: string,
    offerId?: number
): Promise<BookingObjectModel> {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    this.logger.log(
        `For restaurant "${restaurantId}", creating reservation for ` +
        `"${numberOfCustomers}" people on "${date}" at "${time}"...`
    );

    // Step 1: Check availability to determine offer requirements
    const availability = await this.checkAvailability(
        restaurantId,
        date,
        numberOfCustomers,
        time
    );

    // Step 2: Find the requested time slot in availability response
    const requestedSlot = availability.otherAvailableSlotsForThatDay.find(
        (slot) => slot.time === time
    );

    // Step 3: Validate offer requirement
    if (requestedSlot?.isOfferRequired) {
        if (!offerId) {
            const validOfferIds = requestedSlot.requiredOfferIds?.join(", ") || "none";
            throw new GeneralError(
                `An offer must be selected for this time slot. ` +
                `Valid offer IDs: ${validOfferIds}`
            );
        }

        if (
            requestedSlot.requiredOfferIds &&
            !requestedSlot.requiredOfferIds.includes(offerId)
        ) {
            throw new GeneralError(
                `Invalid offer ID ${offerId}. ` +
                `Valid offers for this slot: ${requestedSlot.requiredOfferIds.join(", ")}`
            );
        }
    }

    // Step 4: Upsert customer
    await this.customerService.upsertCustomer(restaurantId, {
        phone: normalizedPhone,
        name,
        email,
    });

    const { zenchefId, apiToken } = await this.getRestaurantCredentials(restaurantId);

    // Step 5: Get Zenchef room ID if roomId provided
    let zenchefRoomId: number | undefined;
    if (roomId) {
        const seatingAreas = await this.restaurantService.getSeatingAreasByRestaurantId(
            restaurantId
        );
        const seatingArea = seatingAreas.find((area) => area.id === roomId);
        if (seatingArea) {
            zenchefRoomId = seatingArea.zenchefRoomId;
        }
    }

    // Step 6: Create the booking with optional offer
    const booking = await this.zenchefService.createReservation(
        zenchefId,
        apiToken,
        numberOfCustomers,
        normalizedPhone,
        name,
        date,
        time,
        comments,
        email,
        zenchefRoomId,
        allergies,
        offerId  // NEW: Pass offer ID
    );

    // Step 7: Check if prepayment was required and log payment URL
    const hasPrepayment = requestedSlot?.seatingAreas.some(
        (area) => area.paymentRequiredForConfirmation
    );
    
    if (hasPrepayment) {
        try {
            const fullBooking = await this.zenchefService.getBookingById(
                zenchefId,
                apiToken,
                booking.bookingId
            );
            
            if (fullBooking.url) {
                console.log(
                    `Prepayment URL for booking ${booking.bookingId}: ${fullBooking.url}`
                );
            } else {
                console.log(
                    `Prepayment required for booking ${booking.bookingId} but no URL received yet`
                );
            }
        } catch (error) {
            this.logger.warn(
                `Failed to fetch booking details for prepayment URL: ${error}`
            );
        }
    }

    // Step 8: Sync to local database (existing logic)
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

    // Step 9: Log operation (existing logic)
    await this.databaseService.operationLog.create({
        data: { type: OperationType.CREATE_RESERVATION, restaurantId },
    });

    // Step 10: Generate description (updated to include offer info)
    let description = `Successfully created a new reservation. `;
    description += `Booking ID: ${booking.bookingId}. `;
    description += `Customer: ${booking.name} (phone: ${booking.phone}`;
    if (booking.email) {
        description += `, email: ${booking.email}`;
    }
    description += `). `;
    description += `Reservation: ${booking.numberOfCustomers} people on ${booking.date} at ${booking.time}.`;
    if (booking.comments) {
        description += ` Special requests: ${booking.comments}.`;
    }
    if (allergies) {
        description += ` Allergies: ${allergies}.`;
    }
    if (offerId) {
        const selectedOffer = availability.offers.find((o) => o.id === offerId);
        description += ` Selected offer: ${selectedOffer?.name || `ID ${offerId}`}.`;
    }
    if (hasPrepayment) {
        description += ` PREPAYMENT REQUIRED: A payment link has been sent to the customer's email.`;
    }

    return new BookingObjectModel({
        ...booking,
        description,
    });
}
```

### ZenchefService Payload with Single Offer

```typescript
// In ZenchefService.createReservation

public async createReservation(
    zenchefId: string,
    apiToken: string,
    numberOfCustomers: number,
    phone: string,
    name: string,
    date: string,
    time: string,
    comments?: string,
    email?: string,
    zenchefRoomId?: number,
    allergies?: string,
    offerId?: number  // NEW
): Promise<Omit<BookingObjectModel, "description">> {
    // Parse name into first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstname = nameParts[0];
    const lastname = nameParts.slice(1).join(" ") || nameParts[0];

    const payload: ZenchefCreateBookingPayload = {
        day: date,
        time: time,
        nb_guests: numberOfCustomers,
        firstname,
        lastname,
        phone_number: phone,
        email: email,
        comment: comments || undefined,
        allergies: allergies || undefined,
        country: "fr",
        status: "confirmed",
    };

    // Add room preference if provided
    if (zenchefRoomId !== undefined) {
        payload.wish = { booking_room_id: zenchefRoomId };
    }

    // NEW: Add offer if provided
    // Customer can only select ONE offer per reservation
    if (offerId !== undefined) {
        payload.offers = [
            {
                count: numberOfCustomers,  // Apply to all guests
                offer_id: offerId,
            },
        ];
    }

    try {
        const response = await firstValueFrom(
            this.httpService.post<ZenchefBookingResponse>(
                `${this.baseUrlV1}/bookings?force=1&with-confirmation=1`,
                payload,
                {
                    headers: this.buildHeaders(apiToken, zenchefId, true),
                }
            )
        );

        return {
            bookingId: response.data.data.id.toString(),
            numberOfCustomers,
            phone,
            name,
            date,
            time,
            comments,
            email,
            allergies,
            canModify: true,
            canCancel: true,
        };
    } catch (error: any) {
        // ... existing error handling
    }
}
```

---

## Booking Update

### Offer Validation on Date/Time Change

When updating a reservation's date or time, the same offer validation logic must be applied:

```typescript
// In ReservationsService.updateReservation

async updateReservation(
    restaurantId: string,
    bookingId: string,
    updates: {
        numberOfCustomers?: number;
        phone?: string;
        name?: string;
        date?: string;
        time?: string;
        comments?: string;
        email?: string;
        roomId?: string;
        allergies?: string;
        offerId?: number;  // NEW: Allow updating offer
    }
): Promise<BookingObjectModel> {
    this.logger.log(
        `For restaurant "${restaurantId}", updating reservation "${bookingId}". ` +
        `Updates: ${JSON.stringify(updates)}`
    );

    const { zenchefId, apiToken } = await this.getRestaurantCredentials(restaurantId);

    // Fetch existing booking to merge with updates
    const existingBooking = await this.zenchefService.getBookingById(
        zenchefId,
        apiToken,
        bookingId
    );

    // Determine final values
    const numberOfCustomers = updates.numberOfCustomers ?? existingBooking.nb_guests;
    const targetDate = updates.date ?? existingBooking.day;
    const targetTime = updates.time ?? existingBooking.time;
    const offerId = updates.offerId;  // NEW: Get offer ID from updates

    // NEW: Validate offer if date or time is changing
    if (updates.date || updates.time) {
        const availability = await this.checkAvailability(
            restaurantId,
            targetDate,
            numberOfCustomers,
            targetTime
        );

        const requestedSlot = availability.otherAvailableSlotsForThatDay.find(
            (slot) => slot.time === targetTime
        );

        if (requestedSlot?.isOfferRequired) {
            // Check if existing booking has an offer
            const existingOfferId = existingBooking.booking_offers?.[0]?.offer_id;
            const effectiveOfferId = offerId ?? existingOfferId;

            if (!effectiveOfferId) {
                throw new GeneralError(
                    `An offer must be selected for this time slot. ` +
                    `Valid offer IDs: ${requestedSlot.requiredOfferIds?.join(", ")}`
                );
            }

            if (
                requestedSlot.requiredOfferIds &&
                !requestedSlot.requiredOfferIds.includes(effectiveOfferId)
            ) {
                throw new GeneralError(
                    `Invalid offer ID ${effectiveOfferId}. ` +
                    `Valid offers for this slot: ${requestedSlot.requiredOfferIds.join(", ")}`
                );
            }
        }
    }

    // ... rest of existing update logic, passing offerId to zenchefService
}
```

### ZenchefService.updateReservation with Offer

```typescript
public async updateReservation(
    zenchefId: string,
    apiToken: string,
    bookingId: string,
    numberOfCustomers: number,
    phone: string,
    name: string,
    date: string,
    time: string,
    comments?: string,
    email?: string,
    zenchefRoomId?: number,
    allergies?: string,
    offerId?: number  // NEW
): Promise<Omit<BookingObjectModel, "description">> {
    // ... existing logic to determine if only time changed ...

    // For full update, include offer in payload
    const payload: ZenchefCreateBookingPayload = {
        day: date,
        time: time,
        nb_guests: numberOfCustomers,
        firstname,
        lastname,
        phone_number: phone,
        email: email,
        comment: comments || undefined,
        allergies: allergies || undefined,
        country: "fr",
        status: "confirmed",
    };

    if (zenchefRoomId !== undefined) {
        payload.wish = { booking_room_id: zenchefRoomId };
    }

    // NEW: Include offer if provided
    if (offerId !== undefined) {
        payload.offers = [
            {
                count: numberOfCustomers,
                offer_id: offerId,
            },
        ];
    }

    // ... rest of existing update logic
}
```

---

## Get/Search Reservations

### Extracting Offer Details from Booking

**Helper Method:**

```typescript
/**
 * Extracts offer details from a Zenchef booking
 * Since customer can only select ONE offer, we take the first item
 */
private extractOfferFromBooking(booking: ZenchefBookingData): {
    offerId?: number;
    offerName?: string;
    offerDescription?: string;
} {
    const bookingOffer = booking.booking_offers?.[0];
    
    if (!bookingOffer) {
        return {};
    }
    
    return {
        offerId: bookingOffer.offer_id,
        offerName: bookingOffer.offer_data?.name,
        offerDescription: bookingOffer.offer_data?.description,
    };
}
```

### Updated getReservationById

```typescript
// In ReservationsService.getReservationById

async getReservationById(
    restaurantId: string,
    bookingId: string
): Promise<BookingObjectModel> {
    this.logger.log(
        `For restaurant "${restaurantId}", getting reservation "${bookingId}".`
    );

    const { zenchefId, apiToken } = await this.getRestaurantCredentials(restaurantId);

    const booking = await this.zenchefService.getBookingById(
        zenchefId,
        apiToken,
        bookingId
    );

    // Map Zenchef booking data to our model
    const fullName = `${booking.firstname} ${booking.lastname}`.trim();
    
    // NEW: Extract offer details
    const offerDetails = this.extractOfferFromBooking(booking);

    // Generate human-readable description
    let description = `Reservation details for Booking ID: ${booking.id}. `;
    description += `Customer: ${fullName} (phone: ${booking.phone_number}`;
    if (booking.email) {
        description += `, email: ${booking.email}`;
    }
    description += `). `;
    description += `Reservation: ${booking.nb_guests} people on ${booking.day} at ${booking.time}. `;
    description += `Status: ${this.getStatusDescription(booking.status)}.`;
    if (booking.comment) {
        description += ` Special requests: ${booking.comment}.`;
    }
    if (booking.allergies) {
        description += ` Allergies: ${booking.allergies}.`;
    }
    if (booking.shift_slot?.shift?.name) {
        description += ` Seating area: ${booking.shift_slot.shift.name}.`;
    }
    // NEW: Include offer in description
    if (offerDetails.offerName) {
        description += ` Selected offer: ${offerDetails.offerName}.`;
    }

    return new BookingObjectModel({
        bookingId: booking.id.toString(),
        numberOfCustomers: booking.nb_guests,
        phone: booking.phone_number || "",
        name: fullName,
        date: booking.day,
        time: booking.time,
        comments: booking.comment || undefined,
        email: booking.email || undefined,
        status: booking.status,
        description,
        // NEW: Include offer details
        offerId: offerDetails.offerId,
        offerName: offerDetails.offerName,
        offerDescription: offerDetails.offerDescription,
    });
}
```

### Updated searchReservations

```typescript
// In ZenchefService.mapToReservationItems

private mapToReservationItems(
    bookings: ZenchefBookingData[]
): ReservationItemModel[] {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const mappedBookings = bookings
        .map((booking) => {
            // NEW: Extract offer details
            const bookingOffer = booking.booking_offers?.[0];
            const offerDetails = bookingOffer
                ? {
                      offerId: bookingOffer.offer_id,
                      offerName: bookingOffer.offer_data?.name,
                      offerDescription: bookingOffer.offer_data?.description,
                  }
                : {};

            return new ReservationItemModel({
                bookingId: booking.id.toString(),
                status: booking.status,
                statusDescription: this.getStatusDescription(booking.status),
                date: booking.day,
                time: booking.time,
                numberOfPeople: booking.nb_guests,
                seatingArea: booking.shift_slot?.shift?.name ?? null,
                customerName: `${booking.firstname} ${booking.lastname}`.trim(),
                customerPhone: booking.phone_number,
                comments: booking.comment || undefined,
                email: booking.email || undefined,
                allergies: booking.allergies || undefined,
                // NEW: Include offer details
                ...offerDetails,
            });
        })
        .filter((booking) => {
            const bookingDate = new Date(booking.date);
            return bookingDate >= oneWeekAgo;
        })
        .sort((a, b) => {
            // ... existing sorting logic
        });

    return mappedBookings;
}
```

---

## Complete Example Flows

### Example 1: Availability Check with All New Features

**Request:**
```
GET /reservations/availability
  ?restaurantId=abc-123
  &date=2025-12-05
  &numberOfPeople=6
  &time=19:00
```

**Response:**
```json
{
  "isRequestedSlotAvailable": true,
  "availableRoomTypesOnRequestedTime": [
    {
      "id": "room-uuid-1",
      "name": "Main Dining Room",
      "description": "Beautiful main dining area",
      "maxCapacity": 50,
      "paymentRequiredForConfirmation": 5000,
      "notCancellable": true
    },
    {
      "id": "room-uuid-2",
      "name": "Private Room",
      "description": "Intimate private dining",
      "maxCapacity": 12,
      "paymentRequiredForConfirmation": 5000,
      "notCancellable": false
    }
  ],
  "offers": [
    {
      "id": 71358,
      "name": "Chef's Heritage Menu",
      "description": "A curated 5-course dining experience featuring seasonal ingredients"
    },
    {
      "id": 71359,
      "name": "Wine Pairing Experience",
      "description": "4-course menu with expertly paired wines"
    }
  ],
  "otherAvailableSlotsForThatDay": [
    {
      "time": "18:00",
      "seatingAreas": [
        {
          "id": "room-uuid-1",
          "name": "Main Dining Room",
          "maxCapacity": 50,
          "paymentRequiredForConfirmation": 5000,
          "notCancellable": false
        }
      ],
      "isOfferRequired": true,
      "requiredOfferIds": [71358, 71359]
    },
    {
      "time": "19:00",
      "seatingAreas": [
        {
          "id": "room-uuid-1",
          "name": "Main Dining Room",
          "maxCapacity": 50,
          "paymentRequiredForConfirmation": 5000,
          "notCancellable": true
        },
        {
          "id": "room-uuid-2",
          "name": "Private Room",
          "maxCapacity": 12,
          "paymentRequiredForConfirmation": 5000,
          "notCancellable": false
        }
      ],
      "isOfferRequired": true,
      "requiredOfferIds": [71358, 71359]
    },
    {
      "time": "20:00",
      "seatingAreas": [
        {
          "id": "room-uuid-1",
          "name": "Main Dining Room",
          "maxCapacity": 50,
          "notCancellable": false
        }
      ],
      "isOfferRequired": false
    }
  ],
  "nextAvailableDate": null,
  "description": "AVAILABILITY CHECK: 6 guests on 2025-12-05 at 19:00\n\nREQUESTED TIME STATUS: AVAILABLE at 19:00\nSEATING OPTIONS FOR 19:00:\n  1. Main Dining Room (ID: room-uuid-1, Capacity: 50) [PREPAYMENT] [NON-CANCELLABLE]\n  2. Private Room (ID: room-uuid-2, Capacity: 12) [PREPAYMENT]\n\nPREPAYMENT NOTICE:\nFor parties of 4+ guests, a prepayment of €50.00 per person is required.\nTotal prepayment: €300.00\nAfter booking, a payment link will be sent to the customer's email.\nThe reservation will remain PENDING until payment is completed.\n\nCANCELLATION RESTRICTION:\nSome time slots are marked as \"notCancellable: true\" in their seating areas.\nBookings for these slots cannot be cancelled by the customer after creation.\n\nOFFER REQUIREMENT:\nSome time slots require selecting an offer (isOfferRequired: true).\nCheck the \"requiredOfferIds\" field for valid offer IDs.\nInclude \"offerId\" when creating a reservation for these slots.\n\nAVAILABLE OFFERS (2 matching your party size):\n  1. \"Chef's Heritage Menu\" (ID: 71358)\n     A curated 5-course dining experience featuring seasonal ingredients\n  2. \"Wine Pairing Experience\" (ID: 71359)\n     4-course menu with expertly paired wines\n\nOTHER AVAILABLE TIMES ON 2025-12-05 (3 slots):\n  - 18:00: 1 seating area(s) [Main Dining Room] [OFFER REQUIRED - IDs: 71358, 71359] [PREPAYMENT]\n  - 19:00: 2 seating area(s) [Main Dining Room, Private Room] [OFFER REQUIRED - IDs: 71358, 71359] [PREPAYMENT] [NON-CANCELLABLE]\n  - 20:00: 1 seating area(s) [Main Dining Room]\n\nIMPORTANT NOTES:\n- Use seating area ID when making a booking to specify preferred room\n- Include \"offerId\" for time slots marked with isOfferRequired: true\n- Bookings with prepayment will be PENDING until payment is completed\n- Non-cancellable bookings cannot be cancelled by the customer"
}
```

---

### Example 1b: Availability Check - No Offers Required (offers field omitted)

**Request:**
```
GET /reservations/availability
  ?restaurantId=abc-123
  &date=2025-12-06
  &numberOfPeople=2
  &time=12:00
```

**Response (note: no "offers" field present):**
```json
{
  "isRequestedSlotAvailable": true,
  "availableRoomTypesOnRequestedTime": [
    {
      "id": "room-uuid-1",
      "name": "Main Dining Room",
      "description": "Beautiful main dining area",
      "maxCapacity": 50
    }
  ],
  "otherAvailableSlotsForThatDay": [
    {
      "time": "12:00",
      "seatingAreas": [
        {
          "id": "room-uuid-1",
          "name": "Main Dining Room",
          "maxCapacity": 50
        }
      ]
    },
    {
      "time": "12:30",
      "seatingAreas": [
        {
          "id": "room-uuid-1",
          "name": "Main Dining Room",
          "maxCapacity": 50
        }
      ]
    }
  ],
  "nextAvailableDate": null,
  "description": "AVAILABILITY CHECK: 2 guests on 2025-12-06 at 12:00\n\nREQUESTED TIME STATUS: AVAILABLE at 12:00\nSEATING OPTIONS FOR 12:00:\n  1. Main Dining Room (ID: room-uuid-1, Capacity: 50)\n\nOTHER AVAILABLE TIMES ON 2025-12-06 (2 slots):\n  - 12:00: 1 seating area(s) [Main Dining Room]\n  - 12:30: 1 seating area(s) [Main Dining Room]\n\nIMPORTANT NOTES:\n- Use seating area ID when making a booking to specify preferred room"
}
```

**Key observation:** When no shift has `is_offer_required: true`, the `offers` field is completely omitted from the response, not set to an empty array. This makes it clear to API consumers that offer selection is not applicable.

---

### Example 2: Create Reservation with Offer

**Request:**
```
POST /reservations
{
  "restaurantId": "abc-123",
  "numberOfCustomers": 6,
  "phone": "+33612345678",
  "name": "Jean Dupont",
  "date": "2025-12-05",
  "time": "19:00",
  "email": "jean.dupont@email.com",
  "roomId": "room-uuid-2",
  "offerId": 71358
}
```

**Validation Flow:**
1. Check availability for 2025-12-05, 6 people, 19:00
2. Find slot 19:00 in response → `isOfferRequired: true`, `requiredOfferIds: [71358, 71359]`
3. Validate that `offerId` (71358) is provided
4. Validate that `offerId` (71358) is in `requiredOfferIds` → ✓
5. Proceed with booking creation

**Console Output (if prepayment required):**
```
Prepayment URL for booking 1526010: https://pay.zenchef.com/booking/1526010/confirm
```

**Response:**
```json
{
  "bookingId": "1526010",
  "numberOfCustomers": 6,
  "phone": "+33612345678",
  "name": "Jean Dupont",
  "date": "2025-12-05",
  "time": "19:00",
  "email": "jean.dupont@email.com",
  "seatingAreaName": "Private Room",
  "canModify": true,
  "canCancel": true,
  "offerId": 71358,
  "offerName": "Chef's Heritage Menu",
  "offerDescription": "A curated 5-course dining experience featuring seasonal ingredients",
  "description": "Successfully created a new reservation. Booking ID: 1526010. Customer: Jean Dupont (phone: +33612345678, email: jean.dupont@email.com). Reservation: 6 people on 2025-12-05 at 19:00. Selected offer: Chef's Heritage Menu. PREPAYMENT REQUIRED: A payment link has been sent to the customer's email."
}
```

---

### Example 3: Create Reservation - Missing Required Offer

**Request:**
```
POST /reservations
{
  "restaurantId": "abc-123",
  "numberOfCustomers": 6,
  "phone": "+33612345678",
  "name": "Jean Dupont",
  "date": "2025-12-05",
  "time": "19:00"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "An offer must be selected for this time slot. Valid offer IDs: 71358, 71359",
  "error": "Bad Request"
}
```

---

### Example 4: Create Reservation - Invalid Offer ID

**Request:**
```
POST /reservations
{
  "restaurantId": "abc-123",
  "numberOfCustomers": 6,
  "phone": "+33612345678",
  "name": "Jean Dupont",
  "date": "2025-12-05",
  "time": "19:00",
  "offerId": 99999
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Invalid offer ID 99999. Valid offers for this slot: 71358, 71359",
  "error": "Bad Request"
}
```

---

### Example 5: Get Reservation with Offer Details

**Request:**
```
GET /reservations/1526010?restaurantId=abc-123
```

**Response:**
```json
{
  "bookingId": "1526010",
  "numberOfCustomers": 6,
  "phone": "+33612345678",
  "name": "Jean Dupont",
  "date": "2025-12-05",
  "time": "19:00",
  "email": "jean.dupont@email.com",
  "status": "waiting",
  "canModify": true,
  "canCancel": true,
  "offerId": 71358,
  "offerName": "Chef's Heritage Menu",
  "offerDescription": "A curated 5-course dining experience featuring seasonal ingredients",
  "description": "Reservation details for Booking ID: 1526010. Customer: Jean Dupont (phone: +33612345678, email: jean.dupont@email.com). Reservation: 6 people on 2025-12-05 at 19:00. Status: Waiting for confirmation. Selected offer: Chef's Heritage Menu."
}
```

---

### Example 6: Search Reservations with Offer Details

**Request:**
```
GET /reservations/search
  ?restaurantId=abc-123
  &phone=+33612345678
```

**Response:**
```json
{
  "reservations": [
    {
      "bookingId": "1526010",
      "status": "waiting",
      "statusDescription": "Waiting for confirmation",
      "date": "2025-12-05",
      "time": "19:00",
      "numberOfPeople": 6,
      "seatingArea": "Dinner",
      "customerName": "Jean Dupont",
      "customerPhone": "+33612345678",
      "email": "jean.dupont@email.com",
      "canModify": true,
      "canCancel": true,
      "offerId": 71358,
      "offerName": "Chef's Heritage Menu",
      "offerDescription": "A curated 5-course dining experience"
    },
    {
      "bookingId": "1526005",
      "status": "confirmed",
      "statusDescription": "Confirmed",
      "date": "2025-11-28",
      "time": "20:00",
      "numberOfPeople": 2,
      "seatingArea": "Dinner",
      "customerName": "Jean Dupont",
      "customerPhone": "+33612345678",
      "canModify": true,
      "canCancel": true
    }
  ],
  "description": "Searched for reservations with filters (phone: +33612345678) (reservations older than 1 week are not shown). Found 2 matching reservations. Details: 2025-12-05 (6 people, Waiting for confirmation); 2025-11-28 (2 people, Confirmed)."
}
```

---

## Validation Rules Summary

| Rule | Check Location | Condition | Action |
|------|----------------|-----------|--------|
| Shift full | checkAvailability | `shift.marked_as_full === true` | Skip entire shift |
| Slot full | checkAvailability | `slot.marked_as_full === true` OR `slot.closed === true` | Skip slot |
| Bookable window (too early) | checkAvailability | `new Date(bookable_from) > now` | Skip slot |
| Bookable window (too late) | checkAvailability | `new Date(bookable_to) < now` | Skip slot |
| Capacity minimum | checkAvailability | `numberOfPeople < capacity.min` | Skip shift |
| Capacity maximum | checkAvailability | `numberOfPeople > capacity.max` | Skip shift |
| Prepayment | checkAvailability | `numberOfPeople >= prepayment_param.min_guests` | Set `paymentRequiredForConfirmation` |
| Cancellation window | checkAvailability | `secondsToReservation < enduser_cancelable_before` | Set `notCancellable` |
| Offer required | checkAvailability | `shift.is_offer_required === true` | Set `isOfferRequired`, `requiredOfferIds` |
| Offer not provided | createReservation | `isOfferRequired && !offerId` | Reject with error |
| Invalid offer ID | createReservation | `!requiredOfferIds.includes(offerId)` | Reject with error |
| Offer on update | updateReservation | Date/time changes + `isOfferRequired` | Validate offer |

---

## Migration Notes

### Breaking Changes

1. **AvailabilityResponseModel.offers** - Now truly optional (field omitted entirely) when no shift has `is_offer_required: true`. Previously always contained matching offers. Clients must check for `undefined` before accessing.

2. **New required validation** - Clients creating bookings must check `isOfferRequired` and provide `offerId` when required

### Backward Compatibility

1. All new fields are optional and will be `undefined` when not applicable
2. Existing API contracts remain unchanged - new fields are additions
3. Bookings without offers continue to work as before for slots where `isOfferRequired` is false

### Recommended Client Updates

1. Check if `offers` field exists before displaying offer selection (field may be undefined)
2. Check `isOfferRequired` flag on time slots before booking
3. Display offer selection UI when `requiredOfferIds` is populated
4. Show prepayment notice when `paymentRequiredForConfirmation` is set
5. Display cancellation warning when `notCancellable` is true

