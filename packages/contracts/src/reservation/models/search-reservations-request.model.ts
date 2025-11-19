import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsOptional, IsString } from "class-validator";

/**
 * Request model for searching reservations
 * All parameters are optional - supports searching by any combination of phone, email, name, and/or date
 */
export class SearchReservationsRequestModel {
    @ApiProperty({
        description: "Optional customer phone number",
        example: "+33612345678",
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        description: "Optional customer email address",
        example: "john.smith@example.com",
        required: false,
    })
    @IsOptional()
    @IsString()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: "Optional date filter (ISO format YYYY-MM-DD). LLM should convert natural language dates to this format.",
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
