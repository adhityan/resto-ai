import { Injectable, Logger } from "@nestjs/common";
import { DatabaseService, CallStatus, Speaker } from "@repo/database";
import {
    CallListItemModel,
    CallListResponseModel,
    CallDetailModel,
    CreateCallModel,
    AddTranscriptModel,
    TranscriptItemModel,
    TranscriptListResponseModel,
} from "@repo/contracts";

export interface CallFilters {
    status?: CallStatus[];
    restaurantId?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
}

@Injectable()
export class CallsService {
    private readonly logger = new Logger(CallsService.name);

    constructor(private readonly databaseService: DatabaseService) {}

    /**
     * Get paginated list of calls with filters
     */
    async getCalls(filters: CallFilters): Promise<CallListResponseModel> {
        this.logger.log(
            `Fetching calls with filters: ${JSON.stringify(filters)}`
        );

        const where: any = {};

        if (filters.status && filters.status.length > 0) {
            where.status = { in: filters.status };
        }

        if (filters.restaurantId) {
            where.restaurantId = filters.restaurantId;
        }

        if (filters.startDate || filters.endDate) {
            where.startTime = {};
            if (filters.startDate) {
                where.startTime.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.startTime.lte = filters.endDate;
            }
        }

        const [calls, total] = await Promise.all([
            this.databaseService.call.findMany({
                where,
                include: {
                    customer: true,
                    restaurant: true,
                },
                orderBy: { startTime: "desc" },
                skip: filters.skip || 0,
                take: filters.take || 10,
            }),
            this.databaseService.call.count({ where }),
        ]);

        const items = calls.map((call) => new CallListItemModel(call));

        return new CallListResponseModel(items, total);
    }

    /**
     * Get call by ID with full details
     */
    async getCallById(id: string): Promise<CallDetailModel | null> {
        this.logger.log(`Fetching call by id: ${id}`);

        const call = await this.databaseService.call.findUnique({
            where: { id },
            include: {
                customer: true,
                restaurant: true,
            },
        });

        if (!call) return null;

        return new CallDetailModel(call);
    }

    /**
     * Get count of active calls (for sidebar badge)
     */
    async getActiveCallsCount(): Promise<number> {
        return this.databaseService.call.count({
            where: { status: CallStatus.ACTIVE },
        });
    }

    /**
     * Create a new call
     */
    async createCall(data: CreateCallModel): Promise<CallDetailModel> {
        this.logger.log(
            `Creating call for restaurant: ${data.restaurantId}, customer: ${data.customerId}`
        );

        const call = await this.databaseService.call.create({
            data: {
                languages: data.languages,
                restaurantId: data.restaurantId,
                customerId: data.customerId,
            },
            include: {
                customer: true,
                restaurant: true,
            },
        });

        return new CallDetailModel(call);
    }

    /**
     * End a call - marks it as completed, sets end time and updates languages
     */
    async endCall(id: string, languages: string[]): Promise<CallDetailModel | null> {
        this.logger.log(`Ending call: ${id} with languages: ${languages.join(",")}`);

        const existingCall = await this.databaseService.call.findUnique({
            where: { id },
        });

        if (!existingCall) return null;

        const call = await this.databaseService.call.update({
            where: { id },
            data: {
                status: CallStatus.COMPLETED,
                endTime: new Date(),
                languages: languages.join(","),
            },
            include: {
                customer: true,
                restaurant: true,
            },
        });

        return new CallDetailModel(call);
    }

    /**
     * Add a transcript entry to a call
     */
    async addTranscript(callId: string, data: AddTranscriptModel): Promise<boolean> {
        this.logger.log(`Adding transcript to call: ${callId}`);

        const existingCall = await this.databaseService.call.findUnique({
            where: { id: callId },
        });

        if (!existingCall) return false;

        await this.databaseService.callTranscript.create({
            data: {
                callId,
                speaker: data.speaker as Speaker,
                contents: data.contents,
                wasInterupted: data.wasInterupted ?? false,
            },
        });

        return true;
    }

    /**
     * Get transcripts for a call
     */
    async getTranscripts(callId: string): Promise<TranscriptListResponseModel | null> {
        this.logger.log(`Fetching transcripts for call: ${callId}`);

        const existingCall = await this.databaseService.call.findUnique({
            where: { id: callId },
        });

        if (!existingCall) return null;

        const transcripts = await this.databaseService.callTranscript.findMany({
            where: { callId },
            orderBy: { time: "asc" },
        });

        const items = transcripts.map((t) => new TranscriptItemModel(t));
        return new TranscriptListResponseModel(items, transcripts.length);
    }
}
