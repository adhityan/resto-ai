import { ApiProperty } from "@nestjs/swagger";

/**
 * Complete booking object returned after create/update operations
 */
export class BookingObjectModel {
    @ApiProperty({
        description: "Unique booking identifier (also serves as the confirmation code)",
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
        description: "Allergies or dietary restrictions",
        example: "Gluten-free, no shellfish",
        required: false,
    })
    allergies?: string;

    @ApiProperty({
        description: "Internal seating area ID (UUID)",
        example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        required: false,
    })
    seatingAreaId?: string;

    @ApiProperty({
        description: "Seating area room name",
        example: "Main Dining Room",
        required: false,
    })
    seatingAreaName?: string;

    @ApiProperty({
        description: "Whether the reservation can be modified",
        example: true,
    })
    canModify: boolean;

    @ApiProperty({
        description: "Whether the reservation can be cancelled",
        example: true,
    })
    canCancel: boolean;

    @ApiProperty({
        description:
            "Human-readable description of the booking operation result for LLM consumption",
        example:
            "Successfully created a new reservation. Booking ID: 1526009. Customer: John Smith (phone: +33612345678). Reservation: 4 people on 2025-10-25 at 19:00.",
    })
    description: string;

    @ApiProperty({
        description: "Reservation status",
        example: "confirmed",
        required: false,
    })
    status?: string;

    constructor(data: {
        bookingId: string;
        numberOfCustomers: number;
        phone: string;
        name: string;
        date: string;
        time: string;
        comments?: string;
        email?: string;
        allergies?: string;
        seatingAreaId?: string;
        seatingAreaName?: string;
        description: string;
        status?: string;
    }) {
        this.bookingId = data.bookingId;
        this.numberOfCustomers = data.numberOfCustomers;
        this.phone = data.phone;
        this.name = data.name;
        this.date = data.date;
        this.time = data.time;
        this.comments = data.comments;
        this.email = data.email;
        this.allergies = data.allergies;
        this.seatingAreaId = data.seatingAreaId;
        this.seatingAreaName = data.seatingAreaName;
        this.description = data.description;
        this.status = data.status;
        
        // Calculate canModify and canCancel based on status and date
        const unchangeableStatuses = ['canceled', 'refused', 'over', 'no_shown'];
        const isUnchangeableStatus = data.status ? unchangeableStatuses.includes(data.status) : false;
        
        // Check if date is in the past (compare with today at midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservationDate = new Date(data.date);
        reservationDate.setHours(0, 0, 0, 0);
        const isPastDate = reservationDate < today;
        
        // For new bookings (no status), assume they can be modified/cancelled if not past
        this.canModify = !isUnchangeableStatus && !isPastDate;
        this.canCancel = !isUnchangeableStatus && !isPastDate;
    }
}
