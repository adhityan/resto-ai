import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Post,
    Put,
    Query,
    Req,
} from "@nestjs/common";
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags,
} from "@nestjs/swagger";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    CancelReservationResponseModel,
    CancelReservationByIdRequestModel,
    CheckAvailabilityRequestModel,
    CreateReservationRequestModel,
    ReservationListResponseModel,
    SearchReservationsRequestModel,
    UpdateReservationRequestModel,
    UpdateReservationByIdRequestModel,
    AdminReservationListResponseModel,
    AdminReservationModel,
} from "@repo/contracts";
import { ReservationStatus } from "@repo/database";
import { ReservationsService } from "./reservations.service";
import { OnlyAdmin, OnlyApp } from "../../decorators/user-api.decorator";
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
     * Search reservations by phone, email, date, and/or customer name
     * All parameters are optional - can be called without parameters to get recent reservations
     */
    @OnlyApp()
    @Post("search")
    @ApiOperation({
        summary:
            "Search reservations by phone, email, date, and/or name (all optional)",
    })
    @ApiOkResponse({ type: ReservationListResponseModel })
    async searchReservations(
        @Req() req: AuthenticatedRequest,
        @Body() body: SearchReservationsRequestModel
    ): Promise<ReservationListResponseModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.searchReservations(
            restaurantId,
            body.phone,
            body.email,
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
            body.roomId,
            body.allergies,
            body.callId
        );
    }

    /**
     * Update an existing reservation (partial updates supported)
     */
    @OnlyApp()
    @Put(":bookingId")
    @ApiOperation({
        summary: "Update an existing reservation (partial updates supported)",
    })
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
            body
        );
    }

    /**
     * Get a specific reservation by booking ID
     */
    @OnlyApp()
    @Get(":bookingId")
    @ApiOperation({ summary: "Get reservation by booking ID" })
    @ApiOkResponse({ type: BookingObjectModel })
    async getReservationById(
        @Req() req: AuthenticatedRequest,
        @Param("bookingId") bookingId: string
    ): Promise<BookingObjectModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.getReservationById(
            restaurantId,
            bookingId
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

    /**
     * Update an existing reservation via POST (bookingId in body)
     * Alternative to PUT /:bookingId for LLM platforms that don't support path parameters
     */
    @OnlyApp()
    @Post("update")
    @ApiOperation({
        summary: "Update an existing reservation via POST (bookingId in body)",
    })
    @ApiOkResponse({ type: BookingObjectModel })
    async updateReservationViaPost(
        @Req() req: AuthenticatedRequest,
        @Body() body: UpdateReservationByIdRequestModel
    ): Promise<BookingObjectModel> {
        const restaurantId = req.loginPayload.userId;
        const { bookingId, ...updateData } = body;

        return this.reservationsService.updateReservation(
            restaurantId,
            bookingId,
            updateData
        );
    }

    /**
     * Cancel an existing reservation via POST (bookingId in body)
     * Alternative to DELETE /:bookingId for LLM platforms that don't support path parameters
     */
    @OnlyApp()
    @Post("cancel")
    @ApiOperation({
        summary: "Cancel a reservation via POST (bookingId in body)",
    })
    @ApiOkResponse({ type: CancelReservationResponseModel })
    async cancelReservationViaPost(
        @Req() req: AuthenticatedRequest,
        @Body() body: CancelReservationByIdRequestModel
    ): Promise<CancelReservationResponseModel> {
        const restaurantId = req.loginPayload.userId;

        return this.reservationsService.cancelReservation(
            restaurantId,
            body.bookingId
        );
    }

    // ==================== Admin UI Endpoints ====================

    /**
     * Get all reservations from local database (Admin UI)
     */
    @OnlyAdmin()
    @Get("admin/list")
    @ApiOperation({
        summary: "Get all reservations from local database (Admin UI)",
    })
    @ApiOkResponse({ type: AdminReservationListResponseModel })
    @ApiQuery({ name: "restaurantId", required: false })
    @ApiQuery({ name: "date", required: false })
    @ApiQuery({
        name: "status",
        required: false,
        description: "Comma-separated statuses",
    })
    @ApiQuery({ name: "skip", required: false, type: Number })
    @ApiQuery({ name: "take", required: false, type: Number })
    async getAdminReservations(
        @Query("restaurantId") restaurantId?: string,
        @Query("date") date?: string,
        @Query("status") status?: string,
        @Query("skip") skip?: string,
        @Query("take") take?: string
    ): Promise<AdminReservationListResponseModel> {
        const statusList = status
            ? (status.split(",") as ReservationStatus[])
            : undefined;

        const result = await this.reservationsService.getReservationsFromDb(
            restaurantId,
            date,
            statusList,
            skip ? Number.parseInt(skip, 10) : 0,
            take ? Number.parseInt(take, 10) : 50
        );

        return new AdminReservationListResponseModel(
            result.items.map((r) => new AdminReservationModel(r)),
            result.total
        );
    }

    /**
     * Get a single reservation from local database by ID (Admin UI)
     */
    @OnlyAdmin()
    @Get("admin/:id")
    @ApiOperation({
        summary: "Get reservation by ID from local database (Admin UI)",
    })
    @ApiOkResponse({ type: AdminReservationModel })
    async getAdminReservationById(
        @Param("id") id: string
    ): Promise<AdminReservationModel> {
        const reservation =
            await this.reservationsService.getReservationFromDbById(id);
        if (!reservation) {
            throw new Error("Reservation not found");
        }
        return new AdminReservationModel(reservation);
    }
}
