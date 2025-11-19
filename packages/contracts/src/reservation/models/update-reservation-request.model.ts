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
 * Request model for updating an existing reservation
 * All fields are optional. Only provided fields will be updated.
 */
export class UpdateReservationRequestModel {
    @ApiProperty({
        description: "Number of customers for the reservation",
        example: 4,
        minimum: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1, { message: "Number of customers must be at least 1" })
    numberOfCustomers?: number;

    @ApiProperty({
        description: "Customer phone number (will be normalized automatically)",
        example: "+33612345678",
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        description: "Customer full name",
        example: "John Smith",
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: "Name must be less than 100 characters" })
    name?: string;

    @ApiProperty({
        description: "Reservation date (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
        required: false,
    })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiProperty({
        description: "Reservation time (24-hour HH:MM format, e.g., 19:00 for 7 PM)",
        example: "19:00",
        required: false,
    })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: "Time must be in 24-hour HH:MM format (e.g., 19:00 for 7 PM)",
    })
    time?: string;

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

    @ApiProperty({
        description: "Allergies or dietary restrictions",
        example: "Gluten-free, no shellfish",
        required: false,
    })
    @IsOptional()
    @IsString()
    allergies?: string;
}
