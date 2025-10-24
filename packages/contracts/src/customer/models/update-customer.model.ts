import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCustomerModel {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: "Customer name must be less than 100 characters" })
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsEmail()
    @MaxLength(255, { message: "Email must be less than 255 characters" })
    email?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: "Address must be less than 500 characters" })
    address?: string;
}
