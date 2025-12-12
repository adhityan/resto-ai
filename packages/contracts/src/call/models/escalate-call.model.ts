import { ApiProperty } from "@nestjs/swagger";

export class EscalateCallResponseModel {
    @ApiProperty({ example: true })
    success: boolean;

    constructor() {
        this.success = true;
    }
}

