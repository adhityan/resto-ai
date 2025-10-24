import { ApiProperty } from "@nestjs/swagger";
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    Min,
} from "class-validator";

/**
 * Request model for checking availability at a restaurant
 */
export class CheckAvailabilityRequestModel {
    @ApiProperty({
        description: "Date to check availability (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
    })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({
        description: "Time to check availability (HH:MM format)",
        example: "19:00",
        required: false,
    })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: "Time must be in HH:MM format",
    })
    time?: string;

    @ApiProperty({
        description: "Number of people for the reservation",
        example: 4,
        minimum: 1,
    })
    @IsNotEmpty()
    @IsInt()
    @Min(1, { message: "Number of people must be at least 1" })
    numberOfPeople: number;

    @ApiProperty({
        description: "Preferred seating area (e.g., 'terrace', 'indoor')",
        example: "terrace",
        required: false,
    })
    @IsOptional()
    @IsString()
    seatingPreference?: string;
}
