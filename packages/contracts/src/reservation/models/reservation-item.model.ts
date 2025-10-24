import { ApiProperty } from "@nestjs/swagger";

/**
 * Represents essential reservation details
 */
export class ReservationItemModel {
    @ApiProperty({
        description: "Unique booking identifier",
        example: "1526009",
    })
    bookingId: string;

    @ApiProperty({
        description: "Reservation status",
        example: "confirmed",
    })
    status: string;

    @ApiProperty({
        description: "Human-readable status description",
        example: "Confirmed",
    })
    statusDescription: string;

    @ApiProperty({
        description: "Reservation date (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
    })
    date: string;

    @ApiProperty({
        description: "Reservation time (HH:MM format)",
        example: "19:30",
    })
    time: string;

    @ApiProperty({
        description: "Number of people for the reservation",
        example: 4,
    })
    numberOfPeople: number;

    @ApiProperty({
        description: "Seating area or shift name",
        example: "Dinner",
        nullable: true,
    })
    seatingArea: string | null;

    @ApiProperty({
        description: "Customer full name",
        example: "John Doe",
    })
    customerName: string;

    @ApiProperty({
        description: "Customer phone number",
        example: "+33612345678",
        nullable: true,
    })
    customerPhone: string | null;
}
