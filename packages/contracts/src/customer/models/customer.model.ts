import { ApiProperty } from "@nestjs/swagger";
import { Customer } from "@repo/database";

export class CustomerModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiProperty({ required: false })
    name?: string;

    @ApiProperty({ required: false })
    email?: string;

    @ApiProperty({ required: false })
    address?: string;

    @ApiProperty()
    numberOfCalls: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(customer: Customer) {
        this.id = customer.id;
        this.phone = customer.phone;
        this.name = customer.name ?? undefined;
        this.email = customer.email ?? undefined;
        this.address = customer.address ?? undefined;
        this.numberOfCalls = customer.numberOfCalls;
        this.createdAt = customer.createdAt;
        this.updatedAt = customer.updatedAt;
    }
}
