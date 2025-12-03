import { ClsModule } from "nestjs-cls";
import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";

import { HttpModule } from "@repo/common";
import { DatabaseModule } from "@repo/database";

import { MainController } from "./main.controller";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { RestaurantModule } from "../restaurant/restaurant.module";
import { CustomerModule } from "../customer/customer.module";
import { CurrencyModule } from "../currency/currency.module";
import { ZenchefModule } from "../zenchef/zenchef.module";
import { ReservationsModule } from "../reservations/reservations.module";
import { StatsModule } from "../stats/stats.module";
import { CallsModule } from "../calls/calls.module";

@Module({
    imports: [
        HttpModule,
        AuthModule,
        UserModule,
        RestaurantModule,
        CustomerModule,
        CurrencyModule,
        ZenchefModule,
        ReservationsModule,
        StatsModule,
        CallsModule,
        DatabaseModule.forRoot(),

        TerminusModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),

        ClsModule.forRoot({
            middleware: {
                mount: true,
                generateId: true,
                // idGenerator: (req: Request) =>
                // req.headers['X-Request-Id'] ?? uuid();
            },
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                autoLogging: {
                    ignore: (req) => req?.url === "/",
                },
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        singleLine: true,
                    },
                },
                level: "trace",
            },
        }),
    ],
    controllers: [MainController],
})
export class MainModule {}
