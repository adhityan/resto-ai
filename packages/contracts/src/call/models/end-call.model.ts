import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class EndCallModel {
    @ApiProperty({
        description: "List of languages detected during the call",
        example: ["en", "fr"],
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    languages: string[];
}
