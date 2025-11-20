import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsOptional,
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
        description:
            "Time to check availability (24-hour HH:MM format, e.g., 19:00 for 7 PM)",
        example: "19:00",
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => (value === "" ? undefined : value))
    @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: "Time must be in 24-hour HH:MM format (e.g., 19:00 for 7 PM)",
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
}
