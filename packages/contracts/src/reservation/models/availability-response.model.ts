import { ApiProperty } from "@nestjs/swagger";

/**
 * Response model for availability check
 */
export class AvailabilityResponseModel {
    @ApiProperty({
        description:
            "Whether the specific requested time slot is available (only present if time was provided in request)",
        example: true,
        required: false,
    })
    isRequestedSlotAvailable?: boolean;

    @ApiProperty({
        description: "List of other available time slots for the requested day",
        example: ["18:00", "19:00", "20:00"],
        type: [String],
    })
    otherAvailableSlotsForThatDay: string[];

    @ApiProperty({
        description:
            "Next available date if no slots available on requested day (ISO format YYYY-MM-DD)",
        example: "2025-10-26",
        nullable: true,
    })
    nextAvailableDate: string | null;

    @ApiProperty({
        description:
            "Human-readable description of the availability check results for LLM consumption",
        example:
            "Availability check for 4 people on 2025-10-25 at 19:00. The requested time slot is AVAILABLE.",
    })
    description: string;
}
