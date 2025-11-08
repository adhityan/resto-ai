import { ApiProperty } from "@nestjs/swagger";

/**
 * Represents an offer available for the party size
 */
export class OfferModel {
    @ApiProperty({ description: "Offer ID", example: 71358 })
    id: number;

    @ApiProperty({ description: "Offer name", example: "Chef's Heritage Menu" })
    name: string;

    @ApiProperty({ 
        description: "Offer description in English", 
        example: "Join us for an unforgettable dining experience..." 
    })
    description: string;
}

/**
 * Represents a seating area with its details
 */
export class SeatingAreaInfoModel {
    @ApiProperty({ description: "Zenchef room ID", example: 104470 })
    zenchefRoomId: number;

    @ApiProperty({ description: "Room name", example: "Main Dining Room" })
    name: string;

    @ApiProperty({ 
        description: "Room description", 
        example: "Beautiful main dining area",
        nullable: true 
    })
    description: string | null;

    @ApiProperty({ description: "Maximum capacity", example: 50 })
    maxCapacity: number;
}

/**
 * Represents a time slot with available seating areas
 */
export class TimeSlotModel {
    @ApiProperty({ description: "Time slot", example: "19:00" })
    time: string;

    @ApiProperty({ 
        description: "Available seating areas for this time slot",
        type: [SeatingAreaInfoModel]
    })
    seatingAreas: SeatingAreaInfoModel[];
}

/**
 * Represents the next available date with seating areas
 */
export class NextAvailableDateModel {
    @ApiProperty({ description: "Next available date (YYYY-MM-DD)", example: "2025-11-26" })
    date: string;

    @ApiProperty({ 
        description: "Available seating areas on that date",
        type: [SeatingAreaInfoModel]
    })
    seatingAreas: SeatingAreaInfoModel[];
}

/**
 * Response model for availability check
 */
export class AvailabilityResponseModel {
    @ApiProperty({
        description: "Whether the specific requested time slot is available",
        example: true,
        required: false,
    })
    isRequestedSlotAvailable?: boolean;

    @ApiProperty({
        description: "Available offers that match the number of guests (filtered by min/max pax and excludes private offers)",
        type: [OfferModel],
    })
    offers: OfferModel[];

    @ApiProperty({
        description: "Available seating areas for the requested time and date (only present if time was provided)",
        type: [SeatingAreaInfoModel],
        required: false,
    })
    availableRoomTypes?: SeatingAreaInfoModel[];

    @ApiProperty({
        description: "Other available time slots for the requested day with their seating areas",
        type: [TimeSlotModel],
    })
    otherAvailableSlotsForThatDay: TimeSlotModel[];

    @ApiProperty({
        description: "Next available date with seating areas if no slots available on requested day",
        type: NextAvailableDateModel,
        nullable: true,
    })
    nextAvailableDate: NextAvailableDateModel | null;

    @ApiProperty({
        description: "Structured, LLM-friendly description with clear sections for availability status, offers, time slots, and seating areas",
        example: "AVAILABILITY CHECK: 4 guests on 2025-11-25 at 19:00\\n\\nREQUESTED TIME STATUS: AVAILABLE at 19:00\\nSEATING OPTIONS FOR 19:00:\\n  1. Main Dining Room (ID: abc-123, Capacity: 50)\\n  2. Patio (ID: def-456, Capacity: 30)\\n\\nAVAILABLE OFFERS (2 matching your party size):\\n  1. \"Dinner\" (ID: 71935)\\n  2. \"Heated Patio\" (ID: 71358)\\n\\nOTHER AVAILABLE TIMES ON 2025-11-25 (3 slots):\\n  - 18:00: 1 seating area(s) [Main Dining Room]\\n  - 19:00: 2 seating area(s) [Main Dining Room, Patio]\\n  - 20:00: 1 seating area(s) [Main Dining Room]"
    })
    description: string;
}
