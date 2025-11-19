import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { randomUUID } from "crypto";
import Fuse from "fuse.js";
import { addDays, format } from "date-fns";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    NextAvailableDateModel,
    OfferModel,
    ReservationItemModel,
    SeatingAreaInfoModel,
    SeatingAreaModel,
    TimeSlotModel,
} from "@repo/contracts";
import { GeneralError } from "../../errors";
import {
    ZenchefAvailabilityResponse,
    ZenchefBookingData,
    ZenchefBookingResponse,
    ZenchefBookingSearchResponse,
    ZenchefChangeTimePayload,
    ZenchefCreateBookingPayload,
    ZenchefShift,
    ZenchefShiftsResponse,
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
        private readonly configService: ConfigService
    ) {
        this.baseUrlV1 =
            this.configService.get<string>("ZENCHEF_API_BASE_URL_V1") || "";
        this.baseUrlV2 =
            this.configService.get<string>("ZENCHEF_API_BASE_URL_V2") || "";
        this.publisherName =
            this.configService.get<string>("ZENCHEF_PUBLISHER_NAME") || "";
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
     * Maps Zenchef room IDs to database seating areas
     */
    private mapRoomIdsToSeatingAreas(
        roomIds: number[],
        restaurantSeatingAreas: Array<{
            id: string;
            zenchefRoomId: number;
            name: string;
            description: string | null;
            maxCapacity: number;
        }>
    ): SeatingAreaInfoModel[] {
        return roomIds
            .map((roomId) => {
                const area = restaurantSeatingAreas.find(
                    (a) => a.zenchefRoomId === roomId
                );
                if (!area) return null;
                return new SeatingAreaInfoModel({
                    id: area.id,
                    name: area.name,
                    description: area.description,
                    maxCapacity: area.maxCapacity,
                });
            })
            .filter((area) => area !== null);
    }

    /**
     * Extracts and filters offers from shifts
     */
    private extractOffers(
        shifts: ZenchefShift[],
        numberOfPeople: number
    ): OfferModel[] {
        const offersMap = new Map<number, OfferModel>();

        for (const shift of shifts) {
            if (!shift.offers) continue;

            for (const offer of shift.offers) {
                // Filter: must not be private, and numberOfPeople must be within range
                if (
                    !offer.is_private &&
                    numberOfPeople >= offer.config.min_pax_available &&
                    numberOfPeople <= offer.config.max_pax_available &&
                    !offersMap.has(offer.id)
                ) {
                    offersMap.set(
                        offer.id,
                        new OfferModel({
                            id: offer.id,
                            name: offer.name,
                            description: offer.description?.en || "",
                        })
                    );
                }
            }
        }

        return Array.from(offersMap.values());
    }

    /**
     * Checks availability for a given date, number of people, and optional time
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @param date - Date to check (ISO format YYYY-MM-DD)
     * @param numberOfPeople - Number of guests
     * @param restaurantSeatingAreas - Seating areas from database with their zenchefRoomId mappings
     * @param time - Optional specific time to check (HH:MM format)
     * @returns Availability information including available slots and next available date
     */
    public async checkAvailability(
        zenchefId: string,
        apiToken: string,
        date: string,
        numberOfPeople: number,
        restaurantSeatingAreas: Array<{
            id: string;
            zenchefRoomId: number;
            name: string;
            description: string | null;
            maxCapacity: number;
        }>,
        time?: string
    ): Promise<Omit<AvailabilityResponseModel, "description">> {
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
                            with: "possible_guests|capacity|occupation",
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
                    numberOfPeople,
                    restaurantSeatingAreas
                );
            }

            const shifts = dayData.shifts;

            // Collect available slots with seating areas
            const availableSlotsMap = new Map<string, Set<number>>();
            let isRequestedSlotAvailable: boolean | undefined = undefined;
            let requestedTimeRoomIds: number[] = [];

            for (const shift of shifts) {
                for (const slot of shift.shift_slots) {
                    if (
                        !slot.closed &&
                        !slot.marked_as_full &&
                        slot.possible_guests.includes(numberOfPeople)
                    ) {
                        // Get available room IDs for this slot
                        const roomIds =
                            slot.available_rooms[numberOfPeople.toString()] ||
                            [];

                        // Only include slots that have rooms in our database
                        const mappedRooms = this.mapRoomIdsToSeatingAreas(
                            roomIds,
                            restaurantSeatingAreas
                        );
                        if (mappedRooms.length === 0) continue;

                        // Add to available slots
                        if (!availableSlotsMap.has(slot.name)) {
                            availableSlotsMap.set(slot.name, new Set());
                        }
                        roomIds.forEach((id) =>
                            availableSlotsMap.get(slot.name)!.add(id)
                        );

                        // Check if this is the requested time
                        if (time && slot.name === time) {
                            isRequestedSlotAvailable = true;
                            requestedTimeRoomIds = roomIds;
                        }
                    }
                }
            }

            // If time was provided but not found in available slots
            if (time !== undefined && isRequestedSlotAvailable === undefined) {
                isRequestedSlotAvailable = false;
            }

            // Extract offers
            const offers = this.extractOffers(shifts, numberOfPeople);

            // Map available slots to TimeSlotModel
            const otherAvailableSlotsForThatDay = Array.from(
                availableSlotsMap.entries()
            )
                .map(
                    ([slotTime, roomIdsSet]) =>
                        new TimeSlotModel({
                            time: slotTime,
                            seatingAreas: this.mapRoomIdsToSeatingAreas(
                                Array.from(roomIdsSet),
                                restaurantSeatingAreas
                            ),
                        })
                )
                .filter((slot) => slot.seatingAreas.length > 0);

            // Map requested time seating areas
            const availableRoomTypesOnRequestedTime = time
                ? this.mapRoomIdsToSeatingAreas(
                      requestedTimeRoomIds,
                      restaurantSeatingAreas
                  )
                : undefined;

            // If no availability, search for next date
            if (otherAvailableSlotsForThatDay.length === 0) {
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
                        // offers,
                        availableRoomTypesOnRequestedTime,
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
                    restaurantSeatingAreas,
                    isRequestedSlotAvailable
                );
            }

            return {
                isRequestedSlotAvailable,
                // offers,
                availableRoomTypesOnRequestedTime,
                otherAvailableSlotsForThatDay,
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
        restaurantSeatingAreas: Array<{
            id: string;
            zenchefRoomId: number;
            name: string;
            description: string | null;
            maxCapacity: number;
        }>,
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
                            // Get room IDs for the first available slot
                            const firstSlot = shift.shift_slots.find(
                                (slot) =>
                                    !slot.closed &&
                                    !slot.marked_as_full &&
                                    slot.possible_guests.includes(
                                        numberOfPeople
                                    )
                            );

                            const roomIds =
                                firstSlot?.available_rooms[
                                    numberOfPeople.toString()
                                ] || [];
                            const seatingAreas = this.mapRoomIdsToSeatingAreas(
                                roomIds,
                                restaurantSeatingAreas
                            );

                            // Extract offers for this date
                            // const offers = this.extractOffers(
                            //     [shift],
                            //     numberOfPeople
                            // );

                            return {
                                isRequestedSlotAvailable,
                                // offers,
                                otherAvailableSlotsForThatDay: [],
                                nextAvailableDate:
                                    seatingAreas.length > 0
                                        ? new NextAvailableDateModel({
                                              date: dayData.date,
                                              seatingAreas,
                                          })
                                        : null,
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
            // offers: [],
            otherAvailableSlotsForThatDay: [],
            nextAvailableDate: null,
        };
    }

    /**
     * Searches for reservations using optional filters: phone, email, date, and/or customer name
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @param phone - Optional customer phone number filter
     * @param email - Optional customer email filter
     * @param date - Optional date filter (ISO format YYYY-MM-DD)
     * @param customerName - Optional customer name for fuzzy search
     * @returns Array of matching reservation items
     */
    public async searchReservations(
        zenchefId: string,
        apiToken: string,
        phone?: string,
        email?: string,
        date?: string,
        customerName?: string
    ): Promise<ReservationItemModel[]> {
        try {
            const params = new URLSearchParams();
            params.append("filters[0][field]", "reservation_type");
            params.append("filters[0][operator]", "=");
            params.append("filters[0][value]", "reservation");

            // Build filters dynamically based on provided parameters
            let filterIndex = 1;

            if (phone) {
                params.append(`filters[${filterIndex}][field]`, "phone_number");
                params.append(`filters[${filterIndex}][operator]`, "=");
                params.append(`filters[${filterIndex}][value]`, phone);
                filterIndex++;
            }

            if (email) {
                params.append(`filters[${filterIndex}][field]`, "email");
                params.append(`filters[${filterIndex}][operator]`, "=");
                params.append(`filters[${filterIndex}][value]`, email);
                filterIndex++;
            }

            if (date) {
                params.append(`filters[${filterIndex}][field]`, "day");
                params.append(`filters[${filterIndex}][operator]`, "=");
                params.append(`filters[${filterIndex}][value]`, date);
                filterIndex++;
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
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @param numberOfCustomers - Number of guests
     * @param phone - Customer phone number
     * @param name - Customer full name
     * @param date - Reservation date (ISO format YYYY-MM-DD)
     * @param time - Reservation time (HH:MM format)
     * @param comments - Optional comments
     * @param email - Optional customer email
     * @param zenchefRoomId - Optional Zenchef room ID
     * @param allergies - Optional allergies or dietary restrictions
     * @returns Complete booking object with booking ID
     * @throws GeneralError if booking cannot be created
     */
    public async createReservation(
        zenchefId: string,
        apiToken: string,
        numberOfCustomers: number,
        phone: string,
        name: string,
        date: string,
        time: string,
        comments?: string,
        email?: string,
        zenchefRoomId?: number,
        allergies?: string
    ): Promise<Omit<BookingObjectModel, "description">> {
        // Parse name into first and last name
        const nameParts = name.trim().split(/\s+/);
        const firstname = nameParts[0];
        const lastname = nameParts.slice(1).join(" ") || nameParts[0];

        const payload: ZenchefCreateBookingPayload = {
            day: date,
            time: time,
            nb_guests: numberOfCustomers,
            firstname,
            lastname,
            phone_number: phone,
            email: email,
            comment: comments || undefined,
            allergies: allergies || undefined,
            country: "fr",
            status: "confirmed",
        };

        if (zenchefRoomId !== undefined) {
            payload.wish = { booking_room_id: zenchefRoomId };
        }

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
                allergies,
                canModify: true, // New bookings can be modified
                canCancel: true,
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
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @param bookingId - Zenchef booking ID
     * @param numberOfCustomers - Number of guests
     * @param phone - Customer phone number
     * @param name - Customer full name
     * @param date - Reservation date (ISO format YYYY-MM-DD)
     * @param time - Reservation time (HH:MM format)
     * @param comments - Optional comments
     * @param email - Optional customer email
     * @param zenchefRoomId - Optional Zenchef room ID
     * @param allergies - Optional allergies or dietary restrictions
     * @returns Updated booking object
     * @throws GeneralError if update fails
     */
    public async updateReservation(
        zenchefId: string,
        apiToken: string,
        bookingId: string,
        numberOfCustomers: number,
        phone: string,
        name: string,
        date: string,
        time: string,
        comments?: string,
        email?: string,
        zenchefRoomId?: number,
        allergies?: string
    ): Promise<Omit<BookingObjectModel, "description">> {
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

                if (zenchefRoomId !== undefined) {
                    changeTimePayload.wish = { booking_room_id: zenchefRoomId };
                }

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
                    comment: comments || undefined,
                    allergies: allergies || undefined,
                    country: "fr",
                    status: "confirmed",
                };

                if (zenchefRoomId !== undefined) {
                    payload.wish = { booking_room_id: zenchefRoomId };
                }

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
                allergies,
                canModify: true, // Updated bookings can be modified
                canCancel: true,
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
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @param bookingId - Zenchef booking ID
     * @throws GeneralError if cancellation fails
     */
    public async cancelReservation(
        zenchefId: string,
        apiToken: string,
        bookingId: string
    ): Promise<void> {
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
     * Gets booking details by ID
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @param bookingId - Zenchef booking ID
     * @returns Complete booking data from Zenchef
     */
    public async getBookingById(
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
            .map(
                (booking) =>
                    new ReservationItemModel({
                        bookingId: booking.id.toString(),
                        status: booking.status,
                        statusDescription: this.getStatusDescription(
                            booking.status
                        ),
                        date: booking.day,
                        time: booking.time,
                        numberOfPeople: booking.nb_guests,
                        seatingArea: booking.shift_slot?.shift?.name ?? null,
                        customerName:
                            `${booking.firstname} ${booking.lastname}`.trim(),
                        customerPhone: booking.phone_number,
                        comments: booking.comment || undefined,
                        email: booking.email || undefined,
                        allergies: booking.allergies || undefined,
                        // Note: seatingAreaId and seatingAreaName would require additional lookups
                        // These can be populated if needed by passing restaurant seating areas
                    })
            )
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
     * Retrieves available seating areas (rooms) for a restaurant
     * @param zenchefId - Restaurant Zenchef ID
     * @param apiToken - Restaurant API token
     * @returns Array of seating areas with id, name, description, and max_capacity
     */
    public async getSeatingAreas(
        zenchefId: string,
        apiToken: string
    ): Promise<SeatingAreaModel[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<ZenchefShiftsResponse>(
                    `${this.baseUrlV2}/restaurants/${zenchefId}/shifts`,
                    {
                        headers: this.buildHeaders(apiToken, zenchefId),
                    }
                )
            );

            // Collect all rooms from all shifts and deduplicate by room id
            const roomsMap = new Map<number, SeatingAreaModel>();

            for (const shift of response.data.data) {
                for (const room of shift.rooms) {
                    if (!roomsMap.has(room.id)) {
                        roomsMap.set(
                            room.id,
                            new SeatingAreaModel({
                                id: room.id,
                                name: room.name,
                                description: room.description,
                                max_capacity: room.capacity,
                            })
                        );
                    }
                }
            }

            return Array.from(roomsMap.values());
        } catch (error: any) {
            this.logger.error(
                `Error fetching seating areas: ${error.message}`,
                error.stack
            );
            throw new GeneralError(
                `Failed to fetch seating areas: ${error.message}`
            );
        }
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
