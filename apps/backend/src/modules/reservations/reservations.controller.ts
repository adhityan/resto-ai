import {
    Body,
    Controller,
    Delete,
    Inject,
    Param,
    Post,
    Put,
    Req,
} from "@nestjs/common";
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from "@nestjs/swagger";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    CancelReservationResponseModel,
    CheckAvailabilityRequestModel,
    CreateReservationRequestModel,
    GetReservationByPhoneRequestModel,
    ReservationListResponseModel,
    SearchReservationsRequestModel,
    UpdateReservationRequestModel,
} from "@repo/contracts";
import { ReservationsService } from "./reservations.service";
import { OnlyApp } from "../../decorators/user-api.decorator";
import { AuthenticatedRequest } from "../../types/request";

/**
 * Controller for managing restaurant reservations via Zenchef API
 */
@ApiTags("reservations")
@Controller("reservations")
export class ReservationsController {
    @Inject()
    private readonly reservationsService: ReservationsService;

    /**
     * Check table availability for a specific date, time, and party size
     */
    @OnlyApp()
    @Post("check-availability")
    @ApiOperation({ summary: "Check table availability" })
    @ApiOkResponse({ type: AvailabilityResponseModel })
    async checkAvailability(
        @Req() req: AuthenticatedRequest,
        @Body() body: CheckAvailabilityRequestModel
    ): Promise<AvailabilityResponseModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.checkAvailability(
            restaurantId,
            body.date,
            body.numberOfPeople,
            body.time
        );
    }

    /**
     * Get all reservations for a customer by phone number
     */
    @OnlyApp()
    @Post("by-phone")
    @ApiOperation({ summary: "Get reservations by phone number" })
    @ApiOkResponse({ type: ReservationListResponseModel })
    async getReservationByPhone(
        @Req() req: AuthenticatedRequest,
        @Body() body: GetReservationByPhoneRequestModel
    ): Promise<ReservationListResponseModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.getReservationByPhone(
            restaurantId,
            body.phone,
            body.date
        );
    }

    /**
     * Search reservations by date and/or customer name with fuzzy matching
     */
    @OnlyApp()
    @Post("search")
    @ApiOperation({ summary: "Search reservations by date and/or name" })
    @ApiOkResponse({ type: ReservationListResponseModel })
    async searchReservations(
        @Req() req: AuthenticatedRequest,
        @Body() body: SearchReservationsRequestModel
    ): Promise<ReservationListResponseModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.searchReservations(
            restaurantId,
            body.date,
            body.customerName
        );
    }

    /**
     * Create a new reservation
     */
    @OnlyApp()
    @Post()
    @ApiOperation({ summary: "Create a new reservation" })
    @ApiCreatedResponse({ type: BookingObjectModel })
    async createReservation(
        @Req() req: AuthenticatedRequest,
        @Body() body: CreateReservationRequestModel
    ): Promise<BookingObjectModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.createReservation(
            restaurantId,
            body.numberOfCustomers,
            body.phone,
            body.name,
            body.date,
            body.time,
            body.comments,
            body.email,
            body.roomId
        );
    }

    /**
     * Update an existing reservation
     */
    @OnlyApp()
    @Put(":bookingId")
    @ApiOperation({ summary: "Update an existing reservation" })
    @ApiOkResponse({ type: BookingObjectModel })
    async updateReservation(
        @Req() req: AuthenticatedRequest,
        @Param("bookingId") bookingId: string,
        @Body() body: UpdateReservationRequestModel
    ): Promise<BookingObjectModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.updateReservation(
            restaurantId,
            bookingId,
            body.numberOfCustomers,
            body.phone,
            body.name,
            body.date,
            body.time,
            body.comments,
            body.email,
            body.roomId
        );
    }

    /**
     * Cancel an existing reservation
     */
    @OnlyApp()
    @Delete(":bookingId")
    @ApiOperation({ summary: "Cancel a reservation" })
    @ApiOkResponse({ type: CancelReservationResponseModel })
    async cancelReservation(
        @Req() req: AuthenticatedRequest,
        @Param("bookingId") bookingId: string
    ): Promise<CancelReservationResponseModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.cancelReservation(
            restaurantId,
            bookingId
        );
    }
}
