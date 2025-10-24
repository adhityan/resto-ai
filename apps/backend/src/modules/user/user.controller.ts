import { Controller, Delete, Get, Inject, Param, Req } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserModel } from "@repo/contracts";

import { UserService } from "./user.service";
import { OnlyAdmin } from "../../decorators/user-api.decorator";
import { AuthenticatedRequest } from "../../types/request";

@ApiTags("user")
@Controller("users")
export class UserController {
    @Inject()
    private readonly userService: UserService;

    @OnlyAdmin()
    @Get()
    @ApiOkResponse({
        type: [UserModel],
    })
    public async getUsers(): Promise<UserModel[]> {
        const users = await this.userService.getUsers();
        return users.map((user) => new UserModel(user));
    }

    @OnlyAdmin()
    @Delete(":id")
    @ApiOkResponse({
        type: UserModel,
    })
    public async deleteUser(@Req() req: AuthenticatedRequest, @Param("id") id: string): Promise<UserModel> {
        const user = await this.userService.deleteUser(id, req.loginPayload.userId);
        return new UserModel(user);
    }
}
