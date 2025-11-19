import {
    Body,
    Controller,
    Delete,
    Get,
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
    ReservationListResponseModel,
    SearchReservationsRequestModel,
    UpdateReservationRequestModel,
} from "@repo/contracts";
import { ReservationsService } from "./reservations.service";
import { OnlyApp } from "../../decorators/user-api.decorator";
import { AuthenticatedRequest } from "../../types/request";
import { CustomerService } from "../customer/customer.service";

/**
 * Controller for managing restaurant reservations via Zenchef API
 */
@ApiTags("reservations")
@Controller("reservations")
export class ReservationsController {
    @Inject()
    private readonly reservationsService: ReservationsService;

    @Inject()
    private readonly customerService: CustomerService;

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

        // Customer management: Find by email first (source of truth)
        let customer = await this.customerService.findCustomerByEmail(
            restaurantId,
            body.email
        );

        if (customer) {
            // Customer exists by email - update phone/name if different
            const updates: { phone?: string; name?: string } = {};
            if (customer.phone !== body.phone) {
                updates.phone = body.phone;
            }
            if (customer.name !== body.name) {
                updates.name = body.name;
            }
            if (Object.keys(updates).length > 0) {
                await this.customerService.updateCustomer(
                    restaurantId,
                    customer.id,
                    updates
                );
            }
        } else {
            // Not found by email - try phone
            customer = await this.customerService.findCustomerByPhone(
                restaurantId,
                body.phone
            );

            if (customer) {
                // Found by phone - update with email and name
                await this.customerService.updateCustomer(
                    restaurantId,
                    customer.id,
                    {
                        email: body.email,
                        name: body.name,
                    }
                );
            } else {
                // Create new customer
                await this.customerService.createCustomer(
                    restaurantId,
                    body.name,
                    body.email,
                    body.phone
                );
            }
        }

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
            body.allergies
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
}
