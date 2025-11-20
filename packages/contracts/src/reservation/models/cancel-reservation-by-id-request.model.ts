import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

/**
 * Request model for cancelling a reservation via POST with bookingId in body
 */
export class CancelReservationByIdRequestModel {
    @ApiProperty({
        description: "Unique booking identifier to cancel",
        example: "1526009",
    })
    @IsNotEmpty({ message: "Booking ID is required" })
    @IsString()
    bookingId: string;
}

