import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ZenchefService } from "./zenchef.service";
import { RestaurantModule } from "../restaurant/restaurant.module";

@Module({
    imports: [HttpModule, RestaurantModule],
    providers: [ZenchefService],
    exports: [ZenchefService],
})
export class ZenchefModule {}
