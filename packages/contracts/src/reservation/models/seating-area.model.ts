import { ApiProperty } from "@nestjs/swagger";

/**
 * Represents a seating area (room) in a restaurant
 */
export class SeatingAreaModel {
    @ApiProperty({
        description: "Unique seating area identifier",
        example: 2560,
    })
    id: number;

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
    max_capacity: number;

    constructor(data: {
        id: number;
        name: string;
        description: string | null;
        max_capacity: number;
    }) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.max_capacity = data.max_capacity;
    }
}
