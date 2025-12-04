import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateRestaurantModel {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100, {
        message: "Restaurant name must be less than 100 characters",
    })
    name: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    information?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    website: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(20, {
        message: "Phone number must be less than 20 characters",
    })
    incomingPhoneNumber: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(10, { message: "Zenchef ID must be less than 10 characters" })
    zenchefId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(50, { message: "API Token must be less than 50 characters" })
    apiToken: string;
}
