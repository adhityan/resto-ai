import { Module } from "@nestjs/common";

import { LivekitController } from "./livekit.controller";
import { LivekitService } from "./livekit.service";
import { RestaurantModule } from "../restaurant/restaurant.module";

@Module({
    imports: [RestaurantModule],
    controllers: [LivekitController],
    providers: [LivekitService],
    exports: [LivekitService],
})
export class LivekitModule {}

