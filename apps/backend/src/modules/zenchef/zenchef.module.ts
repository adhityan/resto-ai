import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ZenchefService } from "./zenchef.service";

@Module({
    imports: [HttpModule],
    providers: [ZenchefService],
    exports: [ZenchefService],
})
export class ZenchefModule {}
