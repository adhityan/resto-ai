/**
 * Zenchef API Type Definitions
 * Based on Zenchef API v1 and v2 Postman documentation
 */

// ============================================================================
// Availability API Types (V2)
// ============================================================================

/**
 * Represents a single time slot in a shift
 */
export interface ZenchefShiftSlot {
    name: string; // "HH:MM" format (e.g., "19:00")
    slot_name: string;
    interval_in_minutes: number;
    closed: boolean;
    marked_as_full: boolean;
    possible_guests: number[]; // Array of allowed guest counts
    waitlist_possible_guests: number[];
    available_rooms: Record<string, number[]>;
}

/**
 * Represents an offer within a shift
 */
export interface ZenchefOffer {
    id: number;
    name: string;
    name_translations?: Record<string, string>;
    description?: Record<string, string>;
    is_private: boolean;
    config: {
        min_pax_available: number;
        max_pax_available: number;
    };
}

/**
 * Represents a shift (e.g., Lunch, Dinner) with its time slots
 */
export interface ZenchefShift {
    id: number;
    name: string; // e.g., "Lunch", "Dinner", "Breakfast"
    comment: string | null;
    open: string; // "HH:MM" format
    close: string; // "HH:MM" format
    total: number;
    waitlist_total: number;
    is_standard: boolean;
    blocked_tables: number[];
    bookable_rooms: number[];
    shift_slots: ZenchefShiftSlot[];
    offers?: ZenchefOffer[];
}

/**
 * Response from GET /restaurants/{restaurantId}/availabilities
 */
export interface ZenchefAvailabilityResponse {
    data: Array<{
        date: string; // "YYYY-MM-DD" format
        shifts: ZenchefShift[];
    }>;
}

// ============================================================================
// Shifts API Types (V2)
// ============================================================================

/**
 * Represents a room (seating area) in a shift
 */
export interface ZenchefRoom {
    id: number;
    name: string;
    description: string | null;
    capacity: number;
    is_bookable: boolean;
}

/**
 * Full shift data from Shifts API
 */
export interface ZenchefShiftData {
    id: number;
    name: string;
    rooms: ZenchefRoom[];
}

/**
 * Response from GET /restaurants/{restaurantId}/shifts
 */
export interface ZenchefShiftsResponse {
    data: ZenchefShiftData[];
}

// ============================================================================
// Booking API Types (V1)
// ============================================================================

/**
 * Customer sheet data within booking response
 */
export interface ZenchefCustomerSheet {
    id: number;
    firstname: string;
    lastname: string;
    email: string | null;
    phone: string | null;
    country: string;
}

/**
 * Shift slot reference in booking
 */
export interface ZenchefBookingShiftSlot {
    name: string; // Time slot name
    slot_name: string;
    shift: {
        id: number;
        name: string; // Shift name (used as seating area)
    };
}

/**
 * Full booking data object from Zenchef API
 */
export interface ZenchefBookingData {
    id: number; // Zenchef booking ID
    type: string;
    partner_id: string;
    reservation_type: string;
    restaurant_id: number;
    day: string; // "YYYY-MM-DD" format
    time: string; // "HH:MM" format
    nb_guests: number;
    firstname: string;
    lastname: string;
    phone_number: string | null;
    email: string | null;
    comment: string | null;
    private_comment: string | null;
    status: string; // "confirmed", "waiting", "canceled", "seated", "over", "no_shown"
    shift_slot: ZenchefBookingShiftSlot | null;
    customersheet?: ZenchefCustomerSheet;
    created_at: string;
    updated_at: string;
}

/**
 * Response from POST /bookings, PUT /bookings/{id}, PATCH /bookings/{id}/changeTime
 */
export interface ZenchefBookingResponse {
    data: ZenchefBookingData;
    metaData?: {
        saved: boolean;
    };
}

/**
 * Response from GET /bookings (search)
 */
export interface ZenchefBookingSearchResponse {
    data: ZenchefBookingData[];
    paginator: {
        total: number;
        count: number;
        limit: number;
        current_page: number;
        total_pages: number;
        next_page: string | null;
        previous_page: string | null;
    };
}

/**
 * Payload for creating a new booking
 */
export interface ZenchefCreateBookingPayload {
    day: string; // "YYYY-MM-DD" format
    time: string; // "HH:MM" format
    nb_guests: number;
    firstname: string;
    lastname: string;
    phone_number?: string;
    email?: string;
    comment?: string;
    country: string; // ISO code (e.g., "fr", "us")
    status: string; // "confirmed" or "waiting"
    wish?: {
        booking_room_id: number;
    };
}

/**
 * Payload for updating an existing booking
 */
export interface ZenchefUpdateBookingPayload
    extends ZenchefCreateBookingPayload {
    // Same structure as create
}

/**
 * Payload for changing booking time
 */
export interface ZenchefChangeTimePayload {
    time: string; // "HH:MM" format
    wish?: {
        booking_room_id: number;
    };
}

/**
 * Error response from Zenchef API
 */
export interface ZenchefErrorResponse {
    error?: string;
    message?: string;
    errors?: Record<string, string[]>;
}
