import { ApiProperty } from "@nestjs/swagger";
import { User } from "@repo/database";

import { UserModel } from "../../user";

export class UserRegisterResponseModel {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: UserModel })
    user: UserModel;

    constructor(user: User) {
        this.id = user.id;
        this.user = new UserModel(user);
    }
}
