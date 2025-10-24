import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

/**
 * Request model for searching reservations
 */
export class SearchReservationsRequestModel {
    @ApiProperty({
        description: "Optional date filter (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
        required: false,
    })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiProperty({
        description: "Optional customer name for fuzzy search",
        example: "John Smith",
        required: false,
    })
    @IsOptional()
    @IsString()
    customerName?: string;
}
