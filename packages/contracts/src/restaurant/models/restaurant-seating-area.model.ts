import { ApiProperty } from "@nestjs/swagger";
import { SeatingArea } from "@repo/database";

/**
 * Represents a seating area for a restaurant stored in our database
 */
export class RestaurantSeatingAreaModel {
    @ApiProperty({
        description: "Unique seating area identifier",
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    id: string;

    @ApiProperty({
        description: "Name of the seating area",
        example: "Salle principale",
    })
    name: string;

    @ApiProperty({
        description: "Description of the seating area",
        example: "Main dining room",
        nullable: true,
    })
    description: string | null;

    @ApiProperty({
        description: "Maximum capacity of the seating area",
        example: 50,
    })
    maxCapacity: number;

    @ApiProperty({
        description: "Zenchef room ID for this seating area",
        example: 2560,
    })
    zenchefRoomId: number;

    constructor(seatingArea: SeatingArea) {
        this.id = seatingArea.id;
        this.name = seatingArea.name;
        this.description = seatingArea.description;
        this.maxCapacity = seatingArea.maxCapacity;
        this.zenchefRoomId = seatingArea.zenchefRoomId;
    }
}
