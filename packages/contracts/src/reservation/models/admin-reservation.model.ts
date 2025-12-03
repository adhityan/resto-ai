import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Reservation, ReservationStatus } from "@repo/database";

/**
 * Admin UI model for reservation from local database
 */
export class AdminReservationModel {
    @ApiProperty()
    id: string;

    @ApiProperty()
    zenchefBookingId: string;

    @ApiProperty({ enum: ReservationStatus })
    status: ReservationStatus;

    @ApiProperty()
    date: string;

    @ApiProperty()
    time: string;

    @ApiProperty()
    numberOfGuests: number;

    @ApiProperty()
    customerName: string;

    @ApiPropertyOptional()
    customerPhone: string | undefined;

    @ApiPropertyOptional()
    customerEmail: string | undefined;

    @ApiPropertyOptional()
    comments: string | undefined;

    @ApiPropertyOptional()
    allergies: string | undefined;

    @ApiPropertyOptional()
    seatingAreaName: string | undefined;

    @ApiProperty()
    restaurantId: string;

    @ApiPropertyOptional()
    restaurantName: string | undefined;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    constructor(
        reservation: Reservation & { restaurant?: { id: string; name: string } }
    ) {
        this.id = reservation.id;
        this.zenchefBookingId = reservation.zenchefBookingId;
        this.status = reservation.status;
        this.date = reservation.date;
        this.time = reservation.time;
        this.numberOfGuests = reservation.numberOfGuests;
        this.customerName = reservation.customerName;
        this.customerPhone = reservation.customerPhone ?? undefined;
        this.customerEmail = reservation.customerEmail ?? undefined;
        this.comments = reservation.comments ?? undefined;
        this.allergies = reservation.allergies ?? undefined;
        this.seatingAreaName = reservation.seatingAreaName ?? undefined;
        this.restaurantId = reservation.restaurantId;
        this.restaurantName = reservation.restaurant?.name;
        this.createdAt = reservation.createdAt;
        this.updatedAt = reservation.updatedAt;
    }
}

export class AdminReservationListResponseModel {
    @ApiProperty({ type: [AdminReservationModel] })
    items: AdminReservationModel[];

    @ApiProperty()
    total: number;

    constructor(items: AdminReservationModel[], total: number) {
        this.items = items;
        this.total = total;
    }
}

