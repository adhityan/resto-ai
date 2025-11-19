import { Module } from "@nestjs/common";

import { ReservationsController } from "./reservations.controller";
import { RestaurantModule } from "../restaurant/restaurant.module";
import { ReservationsService } from "./reservations.service";
import { ZenchefModule } from "../zenchef/zenchef.module";
import { CustomerModule } from "../customer/customer.module";

@Module({
    imports: [RestaurantModule, ZenchefModule, CustomerModule],
    controllers: [ReservationsController],
    providers: [ReservationsService],
    exports: [ReservationsService],
})
export class ReservationsModule {}
