import { ApiProperty } from "@nestjs/swagger";

export class UserChangePasswordSuccessResponse {
    @ApiProperty()
    status: string;

    constructor() {
        this.status = "success";
    }
}
