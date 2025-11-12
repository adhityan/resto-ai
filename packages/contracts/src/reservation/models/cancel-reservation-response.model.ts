import { ApiProperty } from "@nestjs/swagger";

/**
 * Response model for reservation cancellation
 */
export class CancelReservationResponseModel {
    @ApiProperty({
        description:
            "Human-readable description of the cancellation result for LLM consumption",
        example:
            "Successfully cancelled the reservation with Booking ID: 1526009. The reservation has been removed from the system.",
    })
    description: string;

    constructor(data: { description: string }) {
        this.description = data.description;
    }
}
