import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Call, CallStatus } from "@repo/database";

export class CallListItemModel {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: ["ACTIVE", "COMPLETED", "FAILED"] })
    status: CallStatus;

    @ApiProperty()
    startTime: Date;

    @ApiPropertyOptional()
    duration: number | undefined; // in seconds

    @ApiPropertyOptional()
    language: string | undefined;

    @ApiProperty()
    escalationRequested: boolean;

    @ApiPropertyOptional()
    customerName: string | undefined;

    @ApiProperty()
    restaurantName: string;

    @ApiProperty()
    restaurantId: string;

    constructor(
        call: Call & {
            customer?: { name: string } | null;
            restaurant: { name: string };
        }
    ) {
        this.id = call.id;
        this.status = call.status;
        this.startTime = call.startTime;
        this.duration = call.duration ?? undefined;
        this.language = call.language ?? undefined;
        this.escalationRequested = call.escalationRequested;
        this.customerName = call.customer?.name ?? undefined;
        this.restaurantName = call.restaurant.name;
        this.restaurantId = call.restaurantId;
    }
}

