import { ApiProperty } from "@nestjs/swagger";
import { User, UserType } from "@repo/database";

export class UserModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ enum: UserType, enumName: "UserType" })
    type: UserType;

    @ApiProperty()
    createdAt: Date;

    constructor(user: User) {
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.type = user.type;
        this.createdAt = user.createdAt;
    }
}
