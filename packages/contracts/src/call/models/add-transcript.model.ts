import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
} from "class-validator";
import { Speaker } from "@repo/database";

export class AddTranscriptModel {
    @ApiProperty({
        description: "The speaker type",
        enum: Speaker,
        example: Speaker.USER,
    })
    @IsEnum(Speaker)
    @IsNotEmpty()
    speaker: Speaker;

    @ApiProperty({
        description: "The transcript contents",
        example: "Hello, I would like to make a reservation.",
    })
    @IsString()
    @IsNotEmpty()
    contents: string;

    @ApiPropertyOptional({
        description: "Whether the speaker was interrupted",
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    wasInterupted?: boolean;
}
