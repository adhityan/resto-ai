import { ApiProperty } from "@nestjs/swagger";
import { Restaurant, SeatingArea } from "@repo/database";
import { RestaurantSeatingAreaModel } from "./restaurant-seating-area.model";

export class RestaurantModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    information: string;

    @ApiProperty()
    website: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    restaurantPhoneNumber: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: [RestaurantSeatingAreaModel], required: false })
    seatingAreas?: RestaurantSeatingAreaModel[];

    constructor(restaurant: Restaurant, seatingAreas?: SeatingArea[]) {
        this.id = restaurant.id;
        this.name = restaurant.name;
        this.information = restaurant.information;
        this.website = restaurant.website;
        this.isActive = restaurant.isActive;
        this.restaurantPhoneNumber = restaurant.incomingPhoneNumber;
        this.createdAt = restaurant.createdAt;
        this.updatedAt = restaurant.updatedAt;
        this.seatingAreas = seatingAreas?.map(
            (area) => new RestaurantSeatingAreaModel(area)
        );
    }
}
