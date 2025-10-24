import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "@repo/database";

export class RefreshTokenResponseModel {
    @ApiProperty()
    token: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    userType: UserType;

    @ApiProperty()
    expiryDate: Date;

    constructor({
        token,
        userId,
        userType,
        expiryDate,
    }: {
        token: string;
        userId: string;
        userType: UserType;
        expiryDate: Date;
    }) {
        this.token = token;
        this.userId = userId;
        this.userType = userType;
        this.expiryDate = expiryDate;
    }
}
