import { ApiProperty } from "@nestjs/swagger";
import { Customer } from "@repo/database";

export class CustomerModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    phone: string | undefined;

    @ApiProperty()
    email: string | undefined;

    @ApiProperty()
    remoteCustomerId: string;

    @ApiProperty()
    stripeCustomerId: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(customer: Customer) {
        this.id = customer.id;
        this.name = customer.name;
        this.phone = customer.phone ?? undefined;
        this.email = customer.email ?? undefined;
        this.createdAt = customer.createdAt;
        this.updatedAt = customer.updatedAt;
    }
}
