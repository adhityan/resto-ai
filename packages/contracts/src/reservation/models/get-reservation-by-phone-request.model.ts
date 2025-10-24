import { ApiProperty } from "@nestjs/swagger";
import {
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator";

/**
 * Request model for retrieving reservations by phone number
 */
export class GetReservationByPhoneRequestModel {
    @ApiProperty({
        description: "Customer phone number",
        example: "+33612345678",
    })
    @IsNotEmpty()
    @IsString()
    phone: string;

    @ApiProperty({
        description: "Optional date filter (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
        required: false,
    })
    @IsOptional()
    @IsDateString()
    date?: string;
}
