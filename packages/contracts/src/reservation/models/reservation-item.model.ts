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

    @ApiProperty({
        description: "Comments or special requests",
        example: "Window seat preferred",
        required: false,
    })
    comments?: string;

    @ApiProperty({
        description: "Customer email address",
        example: "john.doe@example.com",
        required: false,
    })
    email?: string;

    @ApiProperty({
        description: "Allergies or dietary restrictions",
        example: "Gluten-free",
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

    constructor(data: {
        bookingId: string;
        status: string;
        statusDescription: string;
        date: string;
        time: string;
        numberOfPeople: number;
        seatingArea: string | null;
        customerName: string;
        customerPhone: string | null;
        comments?: string;
        email?: string;
        allergies?: string;
        seatingAreaId?: string;
        seatingAreaName?: string;
    }) {
        this.bookingId = data.bookingId;
        this.status = data.status;
        this.statusDescription = data.statusDescription;
        this.date = data.date;
        this.time = data.time;
        this.numberOfPeople = data.numberOfPeople;
        this.seatingArea = data.seatingArea;
        this.customerName = data.customerName;
        this.customerPhone = data.customerPhone;
        this.comments = data.comments;
        this.email = data.email;
        this.allergies = data.allergies;
        this.seatingAreaId = data.seatingAreaId;
        this.seatingAreaName = data.seatingAreaName;
        
        // Calculate canModify and canCancel based on status and date
        const unchangeableStatuses = ['canceled', 'refused', 'over', 'no_shown'];
        const isUnchangeableStatus = unchangeableStatuses.includes(data.status);
        
        // Check if date is in the past (compare with today at midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reservationDate = new Date(data.date);
        reservationDate.setHours(0, 0, 0, 0);
        const isPastDate = reservationDate < today;
        
        this.canModify = !isUnchangeableStatus && !isPastDate;
        this.canCancel = !isUnchangeableStatus && !isPastDate;
    }
}
