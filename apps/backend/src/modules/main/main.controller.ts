import { Controller, Get } from "@nestjs/common";

import { Public } from "../../decorators/public.decorator";
import { MainService } from "./main.service";

@Controller("/")
export class MainController {
    constructor(private readonly appService: MainService) {}

    @Get()
    @Public()
    healthCheck(): string {
        return this.appService.healthCheck();
    }
}
