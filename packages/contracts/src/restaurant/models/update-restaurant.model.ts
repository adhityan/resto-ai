import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateRestaurantModel {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100, {
        message: "Restaurant name must be less than 100 characters",
    })
    name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    information?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    website?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: "Base path must be less than 500 characters" })
    basePath?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
