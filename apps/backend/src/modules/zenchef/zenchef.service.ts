import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { randomUUID } from "crypto";
import Fuse from "fuse.js";
import { addDays, format } from "date-fns";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    ReservationItemModel,
} from "@repo/contracts";
import { RestaurantService } from "../restaurant/restaurant.service";
import { GeneralError, RestaurantNotFoundError } from "../../errors";
import {
    ZenchefAvailabilityResponse,
    ZenchefBookingData,
    ZenchefBookingResponse,
    ZenchefBookingSearchResponse,
    ZenchefChangeTimePayload,
    ZenchefCreateBookingPayload,
} from "../../types/zenchef";
import { ObjectUtils } from "@repo/utils";

/**
 * Service for interacting with Zenchef reservation API
 * Handles availability checks, reservation CRUD operations
 */
@Injectable()
export class ZenchefService {
    private readonly logger = new Logger(ZenchefService.name);
    private readonly baseUrlV1: string;
    private readonly baseUrlV2: string;
    private readonly publisherName: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(RestaurantService)
        private readonly restaurantService: RestaurantService
    ) {
        this.baseUrlV1 =
            this.configService.get<string>("ZENCHEF_API_BASE_URL_V1") || "";
        this.baseUrlV2 =
            this.configService.get<string>("ZENCHEF_API_BASE_URL_V2") || "";
        this.publisherName =
            this.configService.get<string>("ZENCHEF_PUBLISHER_NAME") || "";
    }

    /**
     * Fetches restaurant Zenchef credentials from database
     * @param restaurantId - Internal restaurant ID
     * @returns Zenchef ID and API token
     * @throws RestaurantNotFoundError if restaurant not found
     * @throws GeneralError if credentials not configured
     */
    private async getRestaurantCredentials(
        restaurantId: string
    ): Promise<{ zenchefId: string; apiToken: string }> {
        const restaurant =
            await this.restaurantService.findRestaurantById(restaurantId);

        if (!restaurant) {
            throw new RestaurantNotFoundError(restaurantId);
        }

        if (!restaurant.zenchefId || !restaurant.apiToken) {
            throw new GeneralError(
                "Restaurant Zenchef credentials not configured"
            );
        }

        return {
            zenchefId: restaurant.zenchefId,
            apiToken: restaurant.apiToken,
        };
    }

    /**
     * Builds HTTP headers for Zenchef API requests
     * @param apiToken - Restaurant API token
     * @param zenchefId - Restaurant Zenchef ID
     * @param includePublisher - Whether to include publisher headers
     * @returns Headers object
     */
    private buildHeaders(
        apiToken: string,
        zenchefId: string,
        includePublisher = false
    ): Record<string, string> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "auth-token": apiToken,
            restaurantId: zenchefId,
        };

        if (includePublisher) {
            headers.PublisherName = this.publisherName;
            headers.PublisherModelId = randomUUID();
        }

        return headers;
    }

    /**
     * Maps Zenchef booking status to human-readable description
     * @param status - Zenchef status code
     * @returns Human-readable status description
     */
    private getStatusDescription(status: string): string {
        const statusMap: Record<string, string> = {
            waiting: "Waiting for confirmation",
            waiting_customer: "Waiting for customer feedback",
            confirmed: "Confirmed",
            canceled: "Canceled",
            refused: "Refused",
            arrived: "Customer arrived",
            seated: "Seated",
            over: "Completed",
            no_shown: "No show",
        };

        return statusMap[status] || status;
    }

    /**
     * Checks availability for a given date, number of people, and optional time/seating preference
     * @param restaurantId - Internal restaurant ID
     * @param date - Date to check (ISO format YYYY-MM-DD)
     * @param numberOfPeople - Number of guests
     * @param time - Optional specific time to check (HH:MM format)
     * @param seatingPreference - Optional seating area preference
     * @returns Availability information including available slots and next available date
     */
    public async checkAvailability(
        restaurantId: string,
        date: string,
        numberOfPeople: number,
        time?: string,
        seatingPreference?: string
    ): Promise<Omit<AvailabilityResponseModel, "description">> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        try {
            // Call availability API for the requested date
            const response = await firstValueFrom(
                this.httpService.get<ZenchefAvailabilityResponse>(
                    `${this.baseUrlV2}/restaurants/${zenchefId}/availabilities`,
                    {
                        headers: this.buildHeaders(apiToken, zenchefId),
                        params: {
                            "date-begin": date,
                            "date-end": date,
                            with: "possible_guests",
                        },
                    }
                )
            );

            const dayData = response.data.data[0];
            if (!dayData) {
                return this.findNextAvailableDate(
                    zenchefId,
                    apiToken,
                    date,
                    numberOfPeople
                );
            }

            // Filter shifts by seating preference if provided
            let shifts = dayData.shifts;
            let triedWithoutPreference = false;

            if (seatingPreference) {
                const preferredShifts = shifts.filter((shift) =>
                    shift.name
                        .toLowerCase()
                        .includes(seatingPreference.toLowerCase())
                );

                if (preferredShifts.length > 0) {
                    shifts = preferredShifts;
                } else {
                    // Try without preference
                    triedWithoutPreference = true;
                    this.logger.log(
                        `No shifts found for preference "${seatingPreference}", checking all shifts`
                    );
                }
            }

            // Collect available slots
            const availableSlots: string[] = [];
            let isRequestedSlotAvailable: boolean | undefined = undefined;

            for (const shift of shifts) {
                for (const slot of shift.shift_slots) {
                    if (
                        !slot.closed &&
                        !slot.marked_as_full &&
                        slot.possible_guests.includes(numberOfPeople)
                    ) {
                        availableSlots.push(slot.name);

                        // Check if this is the requested time
                        if (time && slot.name === time) {
                            isRequestedSlotAvailable = true;
                        }
                    }
                }
            }

            // If time was provided but not found in available slots
            if (time !== undefined && isRequestedSlotAvailable === undefined) {
                isRequestedSlotAvailable = false;
            }

            // If no availability, search for next date
            if (availableSlots.length === 0) {
                // Check for waiting list
                const hasWaitingList = shifts.some(
                    (shift) => shift.waitlist_total > 0
                );

                if (hasWaitingList) {
                    this.logger.log(
                        `No availability but waiting list is available for ${date}`
                    );
                    return {
                        isRequestedSlotAvailable,
                        otherAvailableSlotsForThatDay: [],
                        nextAvailableDate: null,
                    };
                }

                // Search next 30 days
                return this.findNextAvailableDate(
                    zenchefId,
                    apiToken,
                    date,
                    numberOfPeople,
                    isRequestedSlotAvailable
                );
            }

            return {
                isRequestedSlotAvailable,
                otherAvailableSlotsForThatDay: availableSlots,
                nextAvailableDate: null,
            };
        } catch (error: any) {
            this.logger.error(
                `Error checking availability: ${error.message}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to check availability: ${error.message}`
            );
        }
    }

    /**
     * Helper method to find the next available date within 30 days
     */
    private async findNextAvailableDate(
        zenchefId: string,
        apiToken: string,
        startDate: string,
        numberOfPeople: number,
        isRequestedSlotAvailable?: boolean
    ): Promise<Omit<AvailabilityResponseModel, "description">> {
        const startDateObj = new Date(startDate);

        // Search in batches (API allows max 40 days per call)
        for (let batchStart = 1; batchStart <= 30; batchStart += 30) {
            const searchStart = addDays(startDateObj, batchStart);
            const searchEnd = addDays(
                startDateObj,
                Math.min(batchStart + 29, 30)
            );

            try {
                const response = await firstValueFrom(
                    this.httpService.get<ZenchefAvailabilityResponse>(
                        `${this.baseUrlV2}/restaurants/${zenchefId}/availabilities`,
                        {
                            headers: this.buildHeaders(apiToken, zenchefId),
                            params: {
                                "date-begin": format(searchStart, "yyyy-MM-dd"),
                                "date-end": format(searchEnd, "yyyy-MM-dd"),
                                with: "possible_guests",
                            },
                        }
                    )
                );

                // Find first date with availability
                for (const dayData of response.data.data) {
                    for (const shift of dayData.shifts) {
                        const hasAvailability = shift.shift_slots.some(
                            (slot) =>
                                !slot.closed &&
                                !slot.marked_as_full &&
                                slot.possible_guests.includes(numberOfPeople)
                        );

                        if (hasAvailability) {
                            return {
                                isRequestedSlotAvailable,
                                otherAvailableSlotsForThatDay: [],
                                nextAvailableDate: dayData.date,
                            };
                        }
                    }
                }
            } catch (error: any) {
                this.logger.error(
                    `Error searching next available date: ${error.message}`
                );
                // Continue searching
            }
        }

        // No availability found in next 30 days
        return {
            isRequestedSlotAvailable,
            otherAvailableSlotsForThatDay: [],
            nextAvailableDate: null,
        };
    }

    /**
     * Retrieves reservations by customer phone number
     * @param restaurantId - Internal restaurant ID
     * @param phone - Customer phone number
     * @param date - Optional date filter (ISO format YYYY-MM-DD)
     * @returns Array of reservation items
     */
    public async getReservationByPhone(
        restaurantId: string,
        phone: string,
        date?: string
    ): Promise<ReservationItemModel[]> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        try {
            const params = new URLSearchParams();
            params.append("filters[0][field]", "reservation_type");
            params.append("filters[0][operator]", "=");
            params.append("filters[0][value]", "reservation");
            params.append("filters[1][field]", "phone_number");
            params.append("filters[1][operator]", "=");
            params.append("filters[1][value]", phone);

            if (date) {
                params.append("filters[2][field]", "day");
                params.append("filters[2][operator]", "=");
                params.append("filters[2][value]", date);
            }

            params.append("limit", "100");
            params.append("page", "1");

            const response = await firstValueFrom(
                this.httpService.get<ZenchefBookingSearchResponse>(
                    `${this.baseUrlV1}/bookings?${params.toString()}`,
                    {
                        headers: this.buildHeaders(apiToken, zenchefId),
                    }
                )
            );

            return this.mapToReservationItems(response.data.data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                return [];
            }
            this.logger.error(
                `Error getting reservations by phone: ${error.message}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to retrieve reservations: ${error.message}`
            );
        }
    }

    /**
     * Searches for reservations by optional date and customer name
     * @param restaurantId - Internal restaurant ID
     * @param date - Optional date filter (ISO format YYYY-MM-DD)
     * @param customerName - Optional customer name for fuzzy search
     * @returns Array of matching reservation items
     */
    public async searchReservations(
        restaurantId: string,
        date?: string,
        customerName?: string
    ): Promise<ReservationItemModel[]> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        try {
            const params = new URLSearchParams();
            params.append("filters[0][field]", "reservation_type");
            params.append("filters[0][operator]", "=");
            params.append("filters[0][value]", "reservation");

            if (date) {
                params.append("filters[1][field]", "day");
                params.append("filters[1][operator]", "=");
                params.append("filters[1][value]", date);
            }

            params.append("limit", "100");
            params.append("page", "1");

            const response = await firstValueFrom(
                this.httpService.get<ZenchefBookingSearchResponse>(
                    `${this.baseUrlV1}/bookings?${params.toString()}`,
                    {
                        headers: this.buildHeaders(apiToken, zenchefId),
                    }
                )
            );

            let bookings = response.data.data;

            // Apply fuzzy name search if provided
            if (customerName && bookings.length > 0) {
                const bookingsWithFullName = bookings.map((booking) => ({
                    ...booking,
                    fullName: `${booking.firstname} ${booking.lastname}`.trim(),
                }));

                const fuse = new Fuse(bookingsWithFullName, {
                    keys: ["fullName", "firstname", "lastname"],
                    threshold: 0.4, // 40% tolerance for typos/phonetic similarities
                    includeScore: true,
                });

                const results = fuse.search(customerName);
                bookings = results.map((result) => result.item);
            }

            return this.mapToReservationItems(bookings);
        } catch (error: any) {
            if (error.response?.status === 404) {
                return [];
            }
            this.logger.error(
                `Error searching reservations: ${error.message}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to search reservations: ${error.message}`
            );
        }
    }

    /**
     * Creates a new reservation
     * @param restaurantId - Internal restaurant ID
     * @param numberOfCustomers - Number of guests
     * @param phone - Customer phone number
     * @param name - Customer full name
     * @param date - Reservation date (ISO format YYYY-MM-DD)
     * @param time - Reservation time (HH:MM format)
     * @param comments - Optional comments
     * @param email - Optional customer email
     * @param seatingPreference - Optional seating area preference
     * @returns Complete booking object with booking ID
     * @throws GeneralError if booking cannot be created
     */
    public async createReservation(
        restaurantId: string,
        numberOfCustomers: number,
        phone: string,
        name: string,
        date: string,
        time: string,
        comments?: string,
        email?: string,
        seatingPreference?: string
    ): Promise<Omit<BookingObjectModel, "description">> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        // Parse name into first and last name
        const nameParts = name.trim().split(/\s+/);
        const firstname = nameParts[0];
        const lastname = nameParts.slice(1).join(" ") || nameParts[0];

        // Combine seating preference into comments if provided
        let finalComment = comments || "";
        if (seatingPreference) {
            finalComment =
                `${finalComment}${finalComment ? " | " : ""}Seating preference: ${seatingPreference}`.trim();
        }

        const payload: ZenchefCreateBookingPayload = {
            day: date,
            time: time,
            nb_guests: numberOfCustomers,
            firstname,
            lastname,
            phone_number: phone,
            email: email,
            comment: finalComment || undefined,
            country: "fr",
            status: "confirmed",
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post<ZenchefBookingResponse>(
                    `${this.baseUrlV1}/bookings?force=1&with-confirmation=1`,
                    payload,
                    {
                        headers: this.buildHeaders(apiToken, zenchefId, true),
                    }
                )
            );

            return {
                bookingId: response.data.data.id.toString(),
                numberOfCustomers,
                phone,
                name,
                date,
                time,
                comments,
                email,
                seatingPreference,
            };
        } catch (error: any) {
            const errorMessage = this.extractErrorMessage(error);

            // Check if it's an availability error
            if (
                error.response?.status === 400 ||
                error.response?.status === 412
            ) {
                this.logger.warn(
                    `Booking not available for ${date} at ${time}: ${errorMessage}`
                );
                throw new GeneralError(
                    `There is no availability for ${date} date and ${time} time anymore`
                );
            }

            this.logger.error(
                `Error creating reservation: ${ObjectUtils.toString(error)}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to create reservation: ${errorMessage}`
            );
        }
    }

    /**
     * Updates an existing reservation
     * @param restaurantId - Internal restaurant ID
     * @param bookingId - Zenchef booking ID
     * @param numberOfCustomers - Number of guests
     * @param phone - Customer phone number
     * @param name - Customer full name
     * @param date - Reservation date (ISO format YYYY-MM-DD)
     * @param time - Reservation time (HH:MM format)
     * @param comments - Optional comments
     * @param email - Optional customer email
     * @param seatingPreference - Optional seating area preference
     * @returns Updated booking object
     * @throws GeneralError if update fails
     */
    public async updateReservation(
        restaurantId: string,
        bookingId: string,
        numberOfCustomers: number,
        phone: string,
        name: string,
        date: string,
        time: string,
        comments?: string,
        email?: string,
        seatingPreference?: string
    ): Promise<Omit<BookingObjectModel, "description">> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        try {
            // Get current booking to determine if only time changed
            const currentBooking = await this.getBookingById(
                zenchefId,
                apiToken,
                bookingId
            );

            const nameParts = name.trim().split(/\s+/);
            const firstname = nameParts[0];
            const lastname = nameParts.slice(1).join(" ") || nameParts[0];

            let finalComment = comments || "";
            if (seatingPreference) {
                finalComment =
                    `${finalComment}${finalComment ? " | " : ""}Seating preference: ${seatingPreference}`.trim();
            }

            // Check if only time is changing
            const onlyTimeChanged =
                currentBooking.day === date &&
                currentBooking.nb_guests === numberOfCustomers &&
                currentBooking.firstname === firstname &&
                currentBooking.lastname === lastname &&
                currentBooking.phone_number === phone &&
                currentBooking.email === email &&
                currentBooking.time !== time;

            if (onlyTimeChanged) {
                // Use change time API
                this.logger.log(
                    `Only time changed for booking ${bookingId}, using changeTime API`
                );
                const changeTimePayload: ZenchefChangeTimePayload = {
                    time: time,
                };

                await firstValueFrom(
                    this.httpService.patch<ZenchefBookingResponse>(
                        `${this.baseUrlV1}/bookings/${bookingId}/changeTime`,
                        changeTimePayload,
                        {
                            headers: this.buildHeaders(apiToken, zenchefId),
                        }
                    )
                );
            } else {
                // Use full update API
                const payload: ZenchefCreateBookingPayload = {
                    day: date,
                    time: time,
                    nb_guests: numberOfCustomers,
                    firstname,
                    lastname,
                    phone_number: phone,
                    email: email,
                    comment: finalComment || undefined,
                    country: "fr",
                    status: "confirmed",
                };

                await firstValueFrom(
                    this.httpService.put<ZenchefBookingResponse>(
                        `${this.baseUrlV1}/bookings/${bookingId}?force=1&with-confirmation=1`,
                        payload,
                        {
                            headers: this.buildHeaders(apiToken, zenchefId),
                        }
                    )
                );
            }

            return {
                bookingId,
                numberOfCustomers,
                phone,
                name,
                date,
                time,
                comments,
                email,
                seatingPreference,
            };
        } catch (error: any) {
            const errorMessage = this.extractErrorMessage(error);

            if (
                error.response?.status === 400 ||
                error.response?.status === 412
            ) {
                this.logger.warn(
                    `Update not available for ${date} at ${time}: ${errorMessage}`
                );
                throw new GeneralError(
                    `There is no availability for ${date} date and ${time} time anymore`
                );
            }

            this.logger.error(
                `Error updating reservation: ${ObjectUtils.toString(error)}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to update reservation: ${errorMessage}`
            );
        }
    }

    /**
     * Cancels an existing reservation
     * @param restaurantId - Internal restaurant ID
     * @param bookingId - Zenchef booking ID
     * @throws GeneralError if cancellation fails
     */
    public async cancelReservation(
        restaurantId: string,
        bookingId: string
    ): Promise<void> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        try {
            await firstValueFrom(
                this.httpService.patch<ZenchefBookingResponse>(
                    `${this.baseUrlV1}/bookings/${bookingId}/changeStatus`,
                    { status: "canceled" },
                    {
                        headers: this.buildHeaders(apiToken, zenchefId, true),
                    }
                )
            );

            this.logger.log(`Successfully canceled reservation ${bookingId}`);
        } catch (error: any) {
            const errorMessage = this.extractErrorMessage(error);
            this.logger.error(
                `Error canceling reservation: ${ObjectUtils.toString(error)}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to cancel reservation: ${errorMessage}`
            );
        }
    }

    /**
     * Helper method to get booking details by ID
     */
    private async getBookingById(
        zenchefId: string,
        apiToken: string,
        bookingId: string
    ): Promise<ZenchefBookingData> {
        const response = await firstValueFrom(
            this.httpService.get<ZenchefBookingResponse>(
                `${this.baseUrlV1}/bookings/${bookingId}`,
                {
                    headers: this.buildHeaders(apiToken, zenchefId),
                }
            )
        );
        return response.data.data;
    }

    /**
     * Maps Zenchef booking data to reservation item models
     * Filters out reservations older than 1 week and sorts by status priority and date proximity
     */
    private mapToReservationItems(
        bookings: ZenchefBookingData[]
    ): ReservationItemModel[] {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const mappedBookings = bookings
            .map((booking) => ({
                bookingId: booking.id.toString(),
                status: booking.status,
                statusDescription: this.getStatusDescription(booking.status),
                date: booking.day,
                time: booking.time,
                numberOfPeople: booking.nb_guests,
                seatingArea: booking.shift_slot?.shift?.name ?? null,
                customerName: `${booking.firstname} ${booking.lastname}`.trim(),
                customerPhone: booking.phone_number,
            }))
            .filter((booking) => {
                const bookingDate = new Date(booking.date);
                return bookingDate >= oneWeekAgo;
            })
            .sort((a, b) => {
                // First sort by status priority: confirmed > other > cancelled
                const statusPriority = (status: string) => {
                    if (status === "confirmed") return 0;
                    if (status === "cancelled") return 2;
                    return 1; // other statuses
                };

                const statusComparison =
                    statusPriority(a.status) - statusPriority(b.status);
                if (statusComparison !== 0) {
                    return statusComparison;
                }

                // Within each status group, sort by date proximity to today
                const today = new Date().toISOString().split("T")[0];
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                const todayDate = new Date(today);

                const diffA = Math.abs(dateA.getTime() - todayDate.getTime());
                const diffB = Math.abs(dateB.getTime() - todayDate.getTime());

                return diffA - diffB;
            });

        return mappedBookings;
    }

    /**
     * Extracts error message from Zenchef API error response
     */
    private extractErrorMessage(error: any): string {
        if (error.response?.data?.message) {
            return error.response.data.message;
        }
        if (error.response?.data?.error) {
            return error.response.data.error;
        }
        if (error.response?.data?.errors) {
            return JSON.stringify(error.response.data.errors);
        }
        return error.message || "Unknown error";
    }
}
