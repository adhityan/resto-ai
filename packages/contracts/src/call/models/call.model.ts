import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Call, CallStatus } from "@repo/database";

export class CallModel {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: ["ACTIVE", "COMPLETED", "FAILED"] })
    status: CallStatus;

    @ApiProperty()
    startTime: Date;

    @ApiPropertyOptional()
    endTime: Date | undefined;

    @ApiPropertyOptional()
    duration: number | undefined; // in seconds

    @ApiPropertyOptional()
    transcript: string | undefined;

    @ApiPropertyOptional()
    language: string | undefined;

    @ApiProperty()
    escalationRequested: boolean;

    @ApiPropertyOptional()
    customerId: string | undefined;

    @ApiProperty()
    restaurantId: string;

    @ApiPropertyOptional()
    zenchefReservationId: string | undefined;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(call: Call) {
        this.id = call.id;
        this.status = call.status;
        this.startTime = call.startTime;
        this.endTime = call.endTime ?? undefined;
        this.duration = call.duration ?? undefined;
        this.transcript = call.transcript ?? undefined;
        this.language = call.language ?? undefined;
        this.escalationRequested = call.escalationRequested;
        this.customerId = call.customerId ?? undefined;
        this.restaurantId = call.restaurantId;
        this.zenchefReservationId = call.zenchefReservationId ?? undefined;
        this.createdAt = call.createdAt;
        this.updatedAt = call.updatedAt;
    }
}

