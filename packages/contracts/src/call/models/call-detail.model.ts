import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Call, CallStatus, Customer, Restaurant } from "@repo/database";

export class CallDetailCustomerModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiPropertyOptional()
    name?: string;

    @ApiPropertyOptional()
    email?: string;

    constructor(customer: Customer) {
        this.id = customer.id;
        this.phone = customer.phone;
        this.name = customer.name ?? undefined;
        this.email = customer.email ?? undefined;
    }
}

export class CallDetailRestaurantModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    incomingPhoneNumber: string;

    constructor(restaurant: Restaurant) {
        this.id = restaurant.id;
        this.name = restaurant.name;
        this.incomingPhoneNumber = restaurant.incomingPhoneNumber;
    }
}

export class CallDetailModel {
    @ApiProperty()
    id: string;

    @ApiProperty({ enum: ["ACTIVE", "COMPLETED", "FAILED"] })
    status: CallStatus;

    @ApiProperty()
    startTime: Date;

    @ApiPropertyOptional()
    endTime: Date | undefined;

    @ApiPropertyOptional()
    transcript: string | undefined;

    @ApiPropertyOptional()
    language: string | undefined;

    @ApiProperty()
    escalationRequested: boolean;

    @ApiPropertyOptional({ type: CallDetailCustomerModel })
    customer: CallDetailCustomerModel | undefined;

    @ApiProperty({ type: CallDetailRestaurantModel })
    restaurant: CallDetailRestaurantModel;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(
        call: Call & {
            customer?: Customer | null;
            restaurant: Restaurant;
        }
    ) {
        this.id = call.id;
        this.status = call.status;
        this.startTime = call.startTime;
        this.endTime = call.endTime ?? undefined;
        this.transcript = undefined; // Transcript is built from CallTranscript records
        this.language = call.languages ?? undefined;
        this.escalationRequested = call.escalationRequested;
        this.customer = call.customer
            ? new CallDetailCustomerModel(call.customer)
            : undefined;
        this.restaurant = new CallDetailRestaurantModel(call.restaurant);
        this.createdAt = call.createdAt;
        this.updatedAt = call.updatedAt;
    }
}
