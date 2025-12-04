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
    duration: number | undefined; // in seconds (computed)

    @ApiPropertyOptional()
    languages: string | undefined;

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
        this.duration = call.endTime
            ? Math.floor(
                  (call.endTime.getTime() - call.startTime.getTime()) / 1000
              )
            : undefined;
        this.languages = call.languages;
        this.escalationRequested = call.escalationRequested;
        this.customerId = call.customerId;
        this.restaurantId = call.restaurantId;
        this.zenchefReservationId = call.zenchefReservationId ?? undefined;
        this.createdAt = call.createdAt;
        this.updatedAt = call.updatedAt;
    }
}
