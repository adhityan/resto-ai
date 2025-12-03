import { Controller, Get, Inject } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import {
    DashboardResponseModel,
    OperationsOverviewResponseModel,
    CallDurationTrendResponseModel,
    LanguageBreakdownResponseModel,
} from "@repo/contracts";

import { StatsService } from "./stats.service";
import { OnlyAdmin } from "../../decorators/user-api.decorator";

@ApiTags("stats")
@Controller("stats")
export class StatsController {
    @Inject()
    private readonly statsService: StatsService;

    @OnlyAdmin()
    @Get("dashboard")
    @ApiOkResponse({ type: DashboardResponseModel })
    async getDashboard(): Promise<DashboardResponseModel> {
        return this.statsService.getDashboardStats();
    }

    @OnlyAdmin()
    @Get("operations-overview")
    @ApiOkResponse({ type: OperationsOverviewResponseModel })
    async getOperationsOverview(): Promise<OperationsOverviewResponseModel> {
        return this.statsService.getOperationsOverview();
    }

    @OnlyAdmin()
    @Get("call-duration-trend")
    @ApiOkResponse({ type: CallDurationTrendResponseModel })
    async getCallDurationTrend(): Promise<CallDurationTrendResponseModel> {
        return this.statsService.getCallDurationTrend();
    }

    @OnlyAdmin()
    @Get("language-breakdown")
    @ApiOkResponse({ type: LanguageBreakdownResponseModel })
    async getLanguageBreakdown(): Promise<LanguageBreakdownResponseModel> {
        return this.statsService.getLanguageBreakdown();
    }
}

