import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Customer } from "@repo/database";

export class CustomerListItemModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    phone: string;

    @ApiPropertyOptional()
    name?: string;

    @ApiPropertyOptional()
    email?: string;

    @ApiProperty()
    numberOfCalls: number;

    @ApiProperty()
    restaurantName: string;

    @ApiProperty()
    restaurantId: string;

    @ApiProperty()
    createdAt: Date;

    constructor(
        customer: Customer & {
            restaurant: { name: string };
        }
    ) {
        this.id = customer.id;
        this.phone = customer.phone;
        this.name = customer.name ?? undefined;
        this.email = customer.email ?? undefined;
        this.numberOfCalls = customer.numberOfCalls;
        this.restaurantName = customer.restaurant.name;
        this.restaurantId = customer.restaurantId;
        this.createdAt = customer.createdAt;
    }
}
