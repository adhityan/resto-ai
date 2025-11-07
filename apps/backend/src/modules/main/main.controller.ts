import { Controller, Get } from "@nestjs/common";
import {
    HealthCheckService,
    PrismaHealthIndicator,
    HealthCheck,
} from "@nestjs/terminus";

import { Public } from "../../decorators/public.decorator";
import { DatabaseService } from "@repo/database";

@Controller("/")
export class MainController {
    constructor(
        private health: HealthCheckService,
        private prismaHealthIndicator: PrismaHealthIndicator,
        private databaseService: DatabaseService
    ) {}

    @Get()
    @Public()
    @HealthCheck()
    healthCheck() {
        return this.health.check([
            () =>
                this.prismaHealthIndicator.pingCheck(
                    "database",
                    this.databaseService
                ),
        ]);
    }
}
