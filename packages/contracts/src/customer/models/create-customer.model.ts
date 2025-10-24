import { ApiProperty } from "@nestjs/swagger";
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    MaxLength,
} from "class-validator";

export class CreateCustomerModel {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100, {
        message: "Customer name must be less than 100 characters",
    })
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255, { message: "Email must be less than 255 characters" })
    email: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    @IsPhoneNumber()
    phone?: string;
}
