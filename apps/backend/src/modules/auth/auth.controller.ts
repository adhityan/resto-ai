import {
    Body,
    Controller,
    Get,
    Inject,
    Patch,
    Post,
    Req,
} from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";

import {
    UserLoginResponse,
    UserRegisterResponseModel,
    UserLoginRequest,
    UserRegisterRequest,
    UserChangePasswordRequest,
    UserChangePasswordSuccessResponse,
    RefreshTokenResponseModel,
    UserModel,
} from "@repo/contracts";
import { User } from "@repo/database";

import { AuthService } from "./auth.service";
import { Public } from "src/decorators/public.decorator";
import { isAuthenticated, OnlyAdmin } from "src/decorators/user-api.decorator";
import { AuthenticatedRequest } from "src/types/request";
import { UserService } from "../user/user.service";
import { UserNotFoundError } from "src/errors";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    @Inject()
    private readonly authService: AuthService;

    @Inject()
    private readonly userService: UserService;

    @isAuthenticated()
    @Get("/refresh")
    @ApiOkResponse({
        type: RefreshTokenResponseModel,
    })
    public async refresh(
        @Req() req: AuthenticatedRequest
    ): Promise<RefreshTokenResponseModel> {
        return new RefreshTokenResponseModel(
            await this.authService.refreshToken(req.loginPayload.userId)
        );
    }

    @OnlyAdmin()
    @Post("/user/register")
    @ApiOkResponse({
        type: UserRegisterResponseModel,
    })
    public async register(
        @Body() body: UserRegisterRequest
    ): Promise<UserRegisterResponseModel> {
        return new UserRegisterResponseModel(
            await this.authService.registerUser(
                body.name,
                body.email,
                body.password
            )
        );
    }

    @Public()
    @Post("/user/login")
    @ApiOkResponse({
        type: UserLoginResponse,
    })
    public async login(
        @Body() body: UserLoginRequest
    ): Promise<UserLoginResponse> {
        return new UserLoginResponse(
            await this.authService.loginUser(body.email, body.password)
        );
    }

    @OnlyAdmin()
    @Patch("/user/change-password")
    @ApiOkResponse({
        type: UserChangePasswordSuccessResponse,
    })
    public async changePassword(
        @Req() req: AuthenticatedRequest,
        @Body() body: UserChangePasswordRequest
    ): Promise<UserChangePasswordSuccessResponse> {
        await this.authService.changePassword(
            req.loginPayload.userId,
            body.currentPassword,
            body.newPassword
        );
        return new UserChangePasswordSuccessResponse();
    }

    @OnlyAdmin()
    @ApiOkResponse({
        type: UserModel,
    })
    @Get("/user/")
    public async me(@Req() req: AuthenticatedRequest): Promise<UserModel> {
        const user = await this.userService.findUserById(
            req.loginPayload.userId
        );
        if (!user)
            throw new UserNotFoundError({ userId: req.loginPayload.userId });
        return new UserModel(user);
    }
}
