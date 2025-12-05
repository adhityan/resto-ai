/**
 * Zenchef API Type Definitions
 * Based on Zenchef API v1 and v2 Postman documentation
 */

// ============================================================================
// Availability API Types (V2)
// ============================================================================

/**
 * Turn times configuration (slots available per party size)
 */
export interface ZenchefTurnTimes {
    "2_pax_slots"?: number;
    "4_pax_slots"?: number;
    "6_pax_slots"?: number;
    "8_pax_slots"?: number;
    "10_pax_slots"?: number;
    "12_pax_slots"?: number;
    [key: string]: number | undefined;
}

/**
 * Capacity configuration for shifts and slots
 */
export interface ZenchefCapacity {
    min: number | null;
    max: number | null;
    total_per_slot: number | null;
    waitlist_min?: number;
    waitlist_max?: number;
    waitlist_total_per_slot?: number;
    show_turn_times?: boolean;
    buffer_slots_count?: number;
    turn_times?: ZenchefTurnTimes;
}

/**
 * Prepayment parameters for a shift
 */
export interface ZenchefPrepaymentParam {
    is_web_booking_askable: boolean;
    min_guests: number;
    charge_per_guests: number;
}

/**
 * Cancellation parameters for a shift
 */
export interface ZenchefCancelationParam {
    enduser_cancelable_before: number;
    enduser_cancelable_reference: string;
}

/**
 * Confirmation settings for a shift
 */
export interface ZenchefConfirmation {
    is_auto: boolean;
    is_auto_until: string | null;
}

/**
 * Offer configuration
 */
export interface ZenchefOfferConfig {
    is_limited_to_pax?: boolean;
    is_same_for_all?: boolean;
    min_pax_available: number;
    max_pax_available: number;
}

/**
 * Represents an offer within a shift slot
 */
export interface ZenchefSlotOffer {
    id: number;
    has_prepayment: boolean;
    bookable_from: string;
    bookable_to: string;
    capacity: ZenchefCapacity;
    config: ZenchefOfferConfig;
    stock: number;
    has_duration: boolean;
    turn_times: ZenchefTurnTimes | null;
    has_specific_rooms: boolean;
    rooms: number[];
    possible_guests: number[];
    available_rooms: Record<string, number[]> | unknown[];
}

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
    available_rooms: Record<string, number[]> | unknown[];
    capacity?: ZenchefCapacity;
    bookable_from?: string;
    bookable_to?: string;
    offers?: ZenchefSlotOffer[];
}

/**
 * Represents an offer within a shift
 */
export interface ZenchefOffer {
    id: number;
    stock_id?: number;
    name: string;
    name_translations?: Record<string, string>;
    description?: Record<string, string>;
    picture_url?: string;
    stock?: number;
    is_unlimited?: boolean;
    is_private: boolean;
    has_duration?: boolean;
    turn_times?: ZenchefTurnTimes | null;
    charge_per_guests?: number | null;
    has_prepayment?: boolean;
    bookable_from_interval?: number | null;
    bookable_from_reference?: string;
    bookable_to_interval?: number | null;
    bookable_to_reference?: string;
    has_specific_rooms?: boolean;
    rooms?: number[];
    capacity?: ZenchefCapacity;
    config: ZenchefOfferConfig;
    total?: number;
}

/**
 * Represents a shift (e.g., Lunch, Dinner) with its time slots
 */
export interface ZenchefShift {
    id: number;
    name: string; // e.g., "Lunch", "Dinner", "Breakfast"
    name_translations?: Record<string, string>;
    comment: string | Record<string, string> | null;
    open: string; // "HH:MM" format
    close: string; // "HH:MM" format
    bookable_from?: string;
    bookable_to?: string;
    color?: string;
    total: number;
    waitlist_total: number;
    is_standard: boolean;
    capacity?: ZenchefCapacity;
    blocked_tables: number[];
    bookable_rooms: number[];
    is_offer_required?: boolean;
    offer_required_from_pax?: number | null;
    charge_param?: unknown;
    prepayment_param?: ZenchefPrepaymentParam | null;
    cancelation_param?: ZenchefCancelationParam | null;
    confirmation?: ZenchefConfirmation;
    marked_as_full?: boolean;
    closed?: boolean;
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
    allergies: string | null;
    status: string; // "confirmed", "waiting", "canceled", "seated", "over", "no_shown"
    shift_slot: ZenchefBookingShiftSlot | null;
    customersheet?: ZenchefCustomerSheet;
    created_at: string;
    updated_at: string;
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
    allergies?: string;
    country: string; // ISO code (e.g., "fr", "us")
    status: string; // "confirmed" or "waiting"
    wish?: {
        booking_room_id: number;
    };
    /**
     * Offer selection for this booking
     * Customer can only select ONE offer per reservation
     * Array will contain exactly one item when an offer is selected
     */
    offers?: Array<{
        count: number; // Number of guests (typically same as nb_guests)
        offer_id: number; // ID of the selected offer
    }>;
}

/**
 * Payload for updating an existing booking
 */
export interface ZenchefUpdateBookingPayload extends ZenchefCreateBookingPayload {
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
