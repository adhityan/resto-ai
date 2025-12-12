import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
    Query,
} from "@nestjs/common";
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
} from "@nestjs/swagger";
import { CallStatus } from "@repo/database";
import {
    CallListResponseModel,
    CallDetailModel,
    CreateCallModel,
    EndCallModel,
    AddTranscriptModel,
    AddTranscriptResponseModel,
    TranscriptListResponseModel,
    EscalateCallResponseModel,
} from "@repo/contracts";

import { CallsService } from "./calls.service";
import { OnlyAdmin, OnlyApp } from "../../decorators/user-api.decorator";
import { CallNotFoundError } from "../../errors/call-not-found.error";

@ApiTags("calls")
@Controller("calls")
export class CallsController {
    @Inject()
    private readonly callsService: CallsService;

    @OnlyAdmin()
    @Get()
    @ApiOkResponse({ type: CallListResponseModel })
    @ApiQuery({
        name: "status",
        required: false,
        description: "Comma-separated statuses",
    })
    @ApiQuery({ name: "restaurantId", required: false })
    @ApiQuery({ name: "startDate", required: false })
    @ApiQuery({ name: "endDate", required: false })
    @ApiQuery({ name: "skip", required: false, type: Number })
    @ApiQuery({ name: "take", required: false, type: Number })
    async getCalls(
        @Query("status") status?: string,
        @Query("restaurantId") restaurantId?: string,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
        @Query("skip") skip?: string,
        @Query("take") take?: string
    ): Promise<CallListResponseModel> {
        const statusList = status
            ? (status.split(",") as CallStatus[])
            : undefined;

        return this.callsService.getCalls({
            status: statusList,
            restaurantId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            skip: skip ? parseInt(skip, 10) : undefined,
            take: take ? parseInt(take, 10) : undefined,
        });
    }

    @OnlyAdmin()
    @Get("active-count")
    @ApiOkResponse({ type: Number })
    async getActiveCallsCount(): Promise<{ count: number }> {
        const count = await this.callsService.getActiveCallsCount();
        return { count };
    }

    @OnlyAdmin()
    @Get(":id")
    @ApiOkResponse({ type: CallDetailModel })
    async getCallById(@Param("id") id: string): Promise<CallDetailModel> {
        const call = await this.callsService.getCallById(id);
        if (!call) throw new CallNotFoundError(id);
        return call;
    }

    @OnlyAdmin()
    @Get(":id/transcripts")
    @ApiOkResponse({ type: TranscriptListResponseModel })
    async getTranscripts(
        @Param("id") id: string
    ): Promise<TranscriptListResponseModel> {
        const transcripts = await this.callsService.getTranscripts(id);
        if (!transcripts) throw new CallNotFoundError(id);
        return transcripts;
    }

    @OnlyApp()
    @Post()
    @ApiCreatedResponse({ type: CallDetailModel })
    async createCall(@Body() body: CreateCallModel): Promise<CallDetailModel> {
        return this.callsService.createCall(body);
    }

    @OnlyApp()
    @Post(":id/end")
    @ApiOkResponse({ type: CallDetailModel })
    async endCall(
        @Param("id") id: string,
        @Body() body: EndCallModel
    ): Promise<CallDetailModel> {
        const call = await this.callsService.endCall(id, body.languages);
        if (!call) throw new CallNotFoundError(id);
        return call;
    }

    @OnlyApp()
    @Post(":id/transcript")
    @ApiCreatedResponse({ type: AddTranscriptResponseModel })
    async addTranscript(
        @Param("id") id: string,
        @Body() body: AddTranscriptModel
    ): Promise<AddTranscriptResponseModel> {
        const success = await this.callsService.addTranscript(id, body);
        if (!success) throw new CallNotFoundError(id);
        return new AddTranscriptResponseModel();
    }

    @OnlyApp()
    @Post(":id/escalate")
    @ApiOkResponse({ type: EscalateCallResponseModel })
    async escalateCall(
        @Param("id") id: string
    ): Promise<EscalateCallResponseModel> {
        const success = await this.callsService.escalateCall(id);
        if (!success) throw new CallNotFoundError(id);
        return new EscalateCallResponseModel();
    }
}
