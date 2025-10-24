import { ApiProperty } from "@nestjs/swagger";
import { Restaurant } from "@repo/database";

export class RestaurantModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    restaurantPhoneNumber: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(restaurant: Restaurant) {
        this.id = restaurant.id;
        this.name = restaurant.name;
        this.isActive = restaurant.isActive;
        this.restaurantPhoneNumber = restaurant.incomingPhoneNumber;
        this.createdAt = restaurant.createdAt;
        this.updatedAt = restaurant.updatedAt;
    }
}
