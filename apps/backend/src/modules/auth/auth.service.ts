import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User, UserType } from "@repo/database";
import { CryptoUtils } from "@repo/utils";
import { JwtService } from "@nestjs/jwt";

import { BCRYPT_SALT_ROUNDS } from "src/constants/user.constants";
import {
    AuthenticatedRequest,
    TokenData,
    VerificationData,
} from "src/types/request";
import {
    IncorrectPasswordError,
    UserAlreadyRegisteredError,
    UserNotActiveError,
    UserNotFoundError,
} from "src/errors";
import { UserService } from "../user/user.service";
import { RestaurantService } from "../restaurant/restaurant.service";

@Injectable()
export class AuthService {
    public static readonly SALT_RANDOM_BYTES_LENGTH = 16;

    public static privateSign(entity: unknown): string {
        return JSON.stringify(entity);
    }

    private readonly logger = new Logger(AuthService.name);

    @Inject()
    private readonly userService: UserService;

    @Inject()
    private readonly jwtService: JwtService;

    @Inject()
    private readonly configService: ConfigService;

    public async registerUser(
        name: string,
        email: string,
        password: string
    ): Promise<User> {
        const user = await this.userService.findUserByEmail(email);
        if (user) throw new UserAlreadyRegisteredError(email);

        const hashedPassword = CryptoUtils.encryptPassword(
            password,
            BCRYPT_SALT_ROUNDS
        );
        const newUser = await this.userService.createUser(
            name,
            email,
            hashedPassword,
            UserType.SUPER_ADMIN
        );

        this.logger.debug("New user registered", { name, email });
        return newUser;
    }

    public async createLogin(
        userId: string,
        userType: UserType
    ): Promise<{ token: string; expiryDate: Date }> {
        const tokenData: TokenData = {
            userId,
            userType,
        };

        const expiryDate = new Date();
        expiryDate.setTime(
            expiryDate.getTime() +
                parseInt(
                    this.configService.get<string>("JWT_TOKEN_EXPIRY") as string
                )
        );

        const token = await this.jwtService.signAsync(tokenData, {
            algorithm: "HS256",
            secret: this.configService.get("JWT_SECRET_KEY"),
            expiresIn: parseInt(
                this.configService.get<string>("JWT_TOKEN_EXPIRY") as string
            ),
        });

        return { expiryDate, token };
    }

    public async loginUser(
        email: string,
        password: string
    ): Promise<{
        token: string;
        expiryDate: Date;
        user: User;
    }> {
        const user = await this.userService.findUserByEmail(email);
        if (!user) throw new UserNotFoundError({ email });

        const passwordMatch = CryptoUtils.comparePassword(
            password,
            user.passwordHash
        );
        if (passwordMatch) {
            if (!user.isActive) throw new UserNotActiveError({ email });
            const loginData = await this.createLogin(user.id, user.type);

            return {
                expiryDate: loginData.expiryDate,
                token: loginData.token,
                user,
            };
        }

        throw new IncorrectPasswordError({ email });
    }

    public async refreshToken(entityId: string): Promise<{
        token: string;
        userId: string;
        userType: UserType;
        expiryDate: Date;
    }> {
        const user = await this.userService.findUserById(entityId);
        if (!user) throw new UserNotFoundError({ userId: entityId });
        if (!user.isActive) throw new UserNotActiveError({ userId: entityId });

        const loginData = await this.createLogin(entityId, user.type);
        return {
            userId: user.id,
            userType: user.type,
            expiryDate: loginData.expiryDate,
            token: loginData.token,
        };
    }

    public async parseTokenData(token: string): Promise<TokenData> {
        return this.jwtService.verifyAsync<TokenData>(token, {
            secret: this.configService.get("JWT_SECRET_KEY"),
        });
    }

    public async getVerificationCode(
        userId: string,
        userType: UserType
    ): Promise<{ token: string; expiryDate: Date }> {
        const tokenData: VerificationData = { userId, userType };

        const expiryDate = new Date();
        expiryDate.setTime(
            expiryDate.getTime() +
                parseInt(
                    this.configService.get<string>("JWT_TOKEN_EXPIRY") as string
                )
        );

        const token = await this.jwtService.signAsync(tokenData, {
            algorithm: "HS256",
            secret: this.configService.get("JWT_SECRET_KEY"),
            expiresIn: parseInt(
                this.configService.get<string>("JWT_TOKEN_EXPIRY") as string
            ),
        });

        return { expiryDate, token };
    }

    public async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        const user = await this.userService.findUserById(userId);
        if (!user) throw new UserNotFoundError({ userId });

        const passwordMatch = CryptoUtils.comparePassword(
            currentPassword,
            user.passwordHash
        );
        if (!passwordMatch) throw new IncorrectPasswordError({ userId });

        const hashedNewPassword = CryptoUtils.encryptPassword(
            newPassword,
            BCRYPT_SALT_ROUNDS
        );
        await this.userService.updateUserPassword(userId, hashedNewPassword);
    }
}
