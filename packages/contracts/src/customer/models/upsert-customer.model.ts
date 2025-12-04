import { ApiProperty } from "@nestjs/swagger";
import {
    IsBoolean,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
} from "class-validator";

export class UpsertCustomerModel {
    @ApiProperty()
    @IsNotEmpty()
    @IsPhoneNumber()
    phone: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100, {
        message: "Customer name must be less than 100 characters",
    })
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

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isOnCall?: boolean;
}

