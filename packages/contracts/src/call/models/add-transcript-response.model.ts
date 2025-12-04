import { ApiProperty } from "@nestjs/swagger";

export class AddTranscriptResponseModel {
    @ApiProperty({ example: true })
    success: boolean;

    constructor() {
        this.success = true;
    }
}


