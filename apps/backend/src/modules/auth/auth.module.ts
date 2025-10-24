import { Module } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";

import { AuthGuard } from "./guard/auth.guard";
import { AuthController } from "./auth.controller";
import { UserModule } from "../user/user.module";
import { RestaurantModule } from "../restaurant/restaurant.module";

@Module({
    controllers: [AuthController],
    exports: [AuthGuard, AuthService],
    providers: [AuthService, AuthGuard],
    imports: [RestaurantModule, UserModule, JwtModule.register({})],
})
export class AuthModule {}
