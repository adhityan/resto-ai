import { Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { ConfigModule } from "@nestjs/config";

import { DatabaseModule } from "@repo/database";

import { MainService } from "./main.service";
import { MainController } from "./main.controller";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { RestaurantModule } from "../restaurant/restaurant.module";
import { CustomerModule } from "../customer/customer.module";
import { CurrencyModule } from "../currency/currency.module";
import { ZenchefModule } from "../zenchef/zenchef.module";
import { ReservationsModule } from "../reservations/reservations.module";

@Module({
    imports: [
        AuthModule,
        UserModule,
        RestaurantModule,
        CustomerModule,
        CurrencyModule,
        ZenchefModule,
        ReservationsModule,
        DatabaseModule.forRoot(),

        ConfigModule.forRoot({
            isGlobal: true,
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                // serializers: {
                //     req: (req) => ({
                //         id: req.id,
                //         method: req.method,
                //         url: req.url,
                //     }),
                //     res: (res) => ({
                //         statusCode: res.statusCode,
                //     }),
                // },
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
    providers: [MainService],
})
export class MainModule {}
