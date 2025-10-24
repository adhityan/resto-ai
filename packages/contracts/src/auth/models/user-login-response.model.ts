import { ApiProperty } from "@nestjs/swagger";
import { User } from "@repo/database";

import { UserModel } from "../../user";

export class UserLoginResponse {
    @ApiProperty()
    token: string;

    @ApiProperty()
    expiryDate: Date;

    @ApiProperty({ type: UserModel })
    entity: UserModel;

    constructor({ token, expiryDate, user }: { token: string; expiryDate: Date; user: User }) {
        this.token = token;
        this.expiryDate = expiryDate;
        this.entity = new UserModel(user);
    }
}
