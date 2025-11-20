import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { UpdateReservationRequestModel } from "./update-reservation-request.model";

/**
 * Request model for updating a reservation via POST with bookingId in body
 * Extends UpdateReservationRequestModel and adds the bookingId field
 */
export class UpdateReservationByIdRequestModel extends UpdateReservationRequestModel {
    @ApiProperty({
        description: "Unique booking identifier to update",
        example: "1526009",
    })
    @IsNotEmpty({ message: "Booking ID is required" })
    @IsString()
    bookingId: string;
}

