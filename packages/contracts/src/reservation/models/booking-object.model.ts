import { ApiProperty } from "@nestjs/swagger";

/**
 * Complete booking object returned after create/update operations
 */
export class BookingObjectModel {
    @ApiProperty({
        description: "Unique booking identifier from Zenchef",
        example: "1526009",
    })
    bookingId: string;

    @ApiProperty({
        description: "Number of customers for the reservation",
        example: 4,
    })
    numberOfCustomers: number;

    @ApiProperty({
        description: "Customer phone number",
        example: "+33612345678",
    })
    phone: string;

    @ApiProperty({
        description: "Customer full name",
        example: "John Smith",
    })
    name: string;

    @ApiProperty({
        description: "Reservation date (ISO format YYYY-MM-DD)",
        example: "2025-10-25",
    })
    date: string;

    @ApiProperty({
        description: "Reservation time (HH:MM format)",
        example: "19:00",
    })
    time: string;

    @ApiProperty({
        description: "Comments or special requests",
        example: "Window seat preferred",
        required: false,
    })
    comments?: string;

    @ApiProperty({
        description: "Customer email address",
        example: "john.smith@example.com",
        required: false,
    })
    email?: string;

    @ApiProperty({
        description:
            "Human-readable description of the booking operation result for LLM consumption",
        example:
            "Successfully created a new reservation. Booking ID: 1526009. Customer: John Smith (phone: +33612345678). Reservation: 4 people on 2025-10-25 at 19:00.",
    })
    description: string;

    constructor(data: {
        bookingId: string;
        numberOfCustomers: number;
        phone: string;
        name: string;
        date: string;
        time: string;
        comments?: string;
        email?: string;
        description: string;
    }) {
        this.bookingId = data.bookingId;
        this.numberOfCustomers = data.numberOfCustomers;
        this.phone = data.phone;
        this.name = data.name;
        this.date = data.date;
        this.time = data.time;
        this.comments = data.comments;
        this.email = data.email;
        this.description = data.description;
    }
}
