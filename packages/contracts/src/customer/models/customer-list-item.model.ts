import { ApiProperty } from "@nestjs/swagger";
import { Customer } from "@repo/database";

export class CustomerListItemModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    email: string | undefined;

    @ApiProperty()
    phone: string | undefined;

    constructor(customer: Customer) {
        this.id = customer.id;
        this.name = customer.name;
        this.email = customer.email ?? undefined;
        this.phone = customer.phone ?? undefined;
    }
}
