# Zenchef Integration Module

A service module for integrating with Zenchef reservation management API. This module provides comprehensive functionality for checking availability, creating, updating, searching, and canceling restaurant reservations.

## Features

- **Availability Check**: Check table availability for specific dates/times with seating preferences
- **Reservation Search**: Search reservations by phone number or customer name with fuzzy matching
- **Reservation Management**: Create, update, and cancel reservations
- **Waiting List Support**: Automatic detection of waiting list availability
- **Next Available Date**: Finds the next available date within 30 days if requested slot is unavailable
- **Seating Preferences**: Supports seating area preferences (stored in booking comments)

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Zenchef API Configuration
ZENCHEF_API_BASE_URL_V1=https://api.zenchef.com/api/v1
ZENCHEF_API_BASE_URL_V2=https://api.zenchef.com/api/v2
ZENCHEF_PUBLISHER_NAME=YourPublisherName
```

For test environment, use:
```env
ZENCHEF_API_BASE_URL_V1=https://api.preproduction.zenchef.io/api/v1
ZENCHEF_API_BASE_URL_V2=https://api.preproduction.zenchef.io/api/v2
```

### Database Setup

Each restaurant must have Zenchef credentials configured in the database:
- `zenchefId`: Restaurant's Zenchef identifier
- `apiToken`: Restaurant's Zenchef API authentication token

Restaurants can find their credentials in: Zenchef > Settings > Partners page

## API Methods

### 1. checkAvailability

Checks table availability for a given date, number of people, and optional time/seating preference.

```typescript
async checkAvailability(
    zenchefId: string,
    apiToken: string,
    date: string,
    numberOfPeople: number,
    time?: string,
    seatingPreference?: string
): Promise<AvailabilityResponseModel>
```

**Response**:
- `isRequestedSlotAvailable`: Boolean (only present if `time` was provided)
- `otherAvailableSlotsForThatDay`: Array of available time slots
- `nextAvailableDate`: Next available date if no slots found (within 30 days)

**Behavior**:
- If seating preference specified, filters by shift/area name
- Falls back to all areas if preference not found
- Checks waiting list availability if no slots available
- Searches next 30 days for availability if needed

### 2. getReservationByPhone

Retrieves all reservations for a customer by phone number.

```typescript
async getReservationByPhone(
    zenchefId: string,
    apiToken: string,
    phone: string,
    date?: string
): Promise<ReservationItemModel[]>
```

**Returns**: Array of reservations with essential details (status, date, people count, seating area)

### 3. searchReservations

Searches reservations by date and/or customer name with fuzzy matching.

```typescript
async searchReservations(
    zenchefId: string,
    apiToken: string,
    date?: string,
    customerName?: string
): Promise<ReservationItemModel[]>
```

**Features**:
- Fuzzy name matching using Fuse.js (40% tolerance)
- Matches subsets and phonetically similar names
- Returns empty array if no matches found

### 4. createReservation

Creates a new reservation.

```typescript
async createReservation(
    zenchefId: string,
    apiToken: string,
    numberOfCustomers: number,
    phone: string,
    name: string,
    date: string,
    time: string,
    comments?: string,
    email?: string,
    seatingPreference?: string
): Promise<BookingObjectModel>
```

**Returns**: Complete booking object including Zenchef booking ID

**Notes**:
- Automatically splits name into first/last name
- Seating preference appended to comments with "Seating preference:" prefix
- Uses `force=1` to override default occupation settings
- Sends confirmation to customer if configured

**Error**: Throws specific error if time slot not available

### 5. updateReservation

Updates an existing reservation.

```typescript
async updateReservation(
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
    seatingPreference?: string
): Promise<BookingObjectModel>
```

**Smart Update**:
- Uses PATCH `/changeTime` if only time changed
- Uses PUT for full updates if other fields changed
- Returns updated booking object

### 6. cancelReservation

Cancels an existing reservation.

```typescript
async cancelReservation(
    zenchefId: string,
    apiToken: string,
    bookingId: string
): Promise<void>
```

**Error**: Provides detailed failure reason if cancellation fails

## Usage Example

```typescript
import { ZenchefService } from './modules/zenchef/zenchef.service';
import { RestaurantService } from './modules/restaurant/restaurant.service';

@Injectable()
export class BookingService {
    constructor(
        private readonly zenchefService: ZenchefService,
        private readonly restaurantService: RestaurantService
    ) {}

    async checkTableAvailability(restaurantId: string) {
        // Get restaurant credentials first
        const restaurant = await this.restaurantService.findRestaurantById(restaurantId);
        if (!restaurant?.zenchefId || !restaurant?.apiToken) {
            throw new Error('Restaurant credentials not configured');
        }

        const availability = await this.zenchefService.checkAvailability(
            restaurant.zenchefId,
            restaurant.apiToken,
            '2025-10-25',
            4,
            '19:00',
            'terrace'
        );

        if (availability.isRequestedSlotAvailable) {
            console.log('Table available!');
        } else if (availability.otherAvailableSlotsForThatDay.length > 0) {
            console.log('Alternative times:', availability.otherAvailableSlotsForThatDay);
        } else {
            console.log('Next available:', availability.nextAvailableDate);
        }
    }

    async makeReservation(restaurantId: string) {
        // Get restaurant credentials first
        const restaurant = await this.restaurantService.findRestaurantById(restaurantId);
        if (!restaurant?.zenchefId || !restaurant?.apiToken) {
            throw new Error('Restaurant credentials not configured');
        }

        const booking = await this.zenchefService.createReservation(
            restaurant.zenchefId,
            restaurant.apiToken,
            4,
            '+33612345678',
            'John Smith',
            '2025-10-25',
            '19:00',
            'Birthday celebration',
            'john@example.com',
            'terrace'
        );

        console.log('Booking ID:', booking.bookingId);
    }
}
```

## Error Handling

All methods throw `GeneralError` with descriptive messages:
- Availability errors: "There is no availability for {date} date and {time} time anymore"
- Credential errors: "Restaurant Zenchef credentials not configured"
- API errors: Include full Zenchef error message

## Zenchef API Details

### Endpoints Used

**V1 API** (bookings CRUD):
- `GET /bookings` - Search bookings
- `GET /bookings/{id}` - Get booking details
- `POST /bookings` - Create booking
- `PUT /bookings/{id}` - Update booking
- `PATCH /bookings/{id}/changeTime` - Change booking time
- `PATCH /booking/{id}/changeStatus` - Change booking status (cancel)

**V2 API** (availabilities):
- `GET /restaurants/{id}/availabilities` - Get availability calendar

### Status Codes

Booking statuses returned by Zenchef:
- `waiting`: Waiting for restaurant confirmation
- `confirmed`: Confirmed by restaurant
- `canceled`: Canceled
- `seated`: Guests are seated
- `over`: Service completed
- `no_shown`: Customer didn't show up

## Dependencies

- `@nestjs/axios`: HTTP client
- `fuse.js`: Fuzzy search for customer names
- `date-fns`: Date manipulation
- `RestaurantModule`: Access to restaurant credentials

