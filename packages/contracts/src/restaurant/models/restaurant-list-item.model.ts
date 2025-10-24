import { ApiProperty } from "@nestjs/swagger";
import { Restaurant } from "@repo/database";

export class RestaurantListItemModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    constructor(restaurant: Restaurant) {
        this.id = restaurant.id;
        this.name = restaurant.name;
    }
}
