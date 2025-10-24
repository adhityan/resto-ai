import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateRestaurantModel {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(100, {
        message: "Restaurant name must be less than 100 characters",
    })
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(500, { message: "Base path must be less than 500 characters" })
    basePath: string;

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
