import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCallModel {
    @ApiProperty({ description: "Comma-separated list of languages (e.g. 'en,fr')" })
    @IsNotEmpty()
    @IsString()
    languages: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    restaurantId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    customerId: string;
}

