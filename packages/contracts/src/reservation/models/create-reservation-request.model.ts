import { ApiProperty } from "@nestjs/swagger";
import {
    IsDateString,
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    Min,
} from "class-validator";

/**
 * Request model for creating a new reservation
 */
export class CreateReservationRequestModel {
    @ApiProperty({
        description: "Number of customers for the reservation",
        example: 4,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1, { message: "Number of customers must be at least 1" })
    numberOfCustomers: number;

    @ApiProperty({
        description: "Customer phone number",
        example: "+33612345678",
    })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({
        description: "Customer full name",
        example: "John Smith",
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100, { message: "Name must be less than 100 characters" })
    name: string;

    @ApiProperty({
        description: "Reservation date (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
    })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({
        description: "Reservation time (HH:MM format)",
        example: "19:00",
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: "Time must be in HH:MM format",
    })
    time: string;

    @ApiProperty({
        description: "Optional comments or special requests",
        example: "Window seat preferred",
        required: false,
    })
    @IsOptional()
    @IsString()
    comments?: string;

    @ApiProperty({
        description: "Customer email address",
        example: "john.smith@example.com",
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: "Seating area/room ID to assign the booking to",
        example: "uuid-here",
        required: false,
    })
    @IsOptional()
    @IsString()
    roomId?: string;
}
