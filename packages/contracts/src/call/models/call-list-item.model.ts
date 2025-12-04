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
    endTime: Date | undefined;

    @ApiPropertyOptional()
    language: string | undefined;

    @ApiProperty()
    escalationRequested: boolean;

    @ApiPropertyOptional()
    customerId: string | undefined;

    @ApiPropertyOptional()
    customerName: string | undefined;

    @ApiProperty()
    restaurantName: string;

    @ApiProperty()
    restaurantId: string;

    constructor(
        call: Call & {
            customer?: { id: string; name: string | null } | null;
            restaurant: { name: string };
        }
    ) {
        this.id = call.id;
        this.status = call.status;
        this.startTime = call.startTime;
        this.endTime = call.endTime ?? undefined;
        this.language = call.languages ?? undefined;
        this.escalationRequested = call.escalationRequested;
        this.customerId = call.customer?.id ?? undefined;
        this.customerName = call.customer?.name ?? undefined;
        this.restaurantName = call.restaurant.name;
        this.restaurantId = call.restaurantId;
    }
}
