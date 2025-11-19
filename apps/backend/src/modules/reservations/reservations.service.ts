import { Injectable, Logger } from "@nestjs/common";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    CancelReservationResponseModel,
    ReservationListResponseModel,
} from "@repo/contracts";
import { CacheUtil, normalizePhoneNumber } from "@repo/utils";
import { ZenchefService } from "../zenchef/zenchef.service";
import { RestaurantService } from "../restaurant/restaurant.service";
import { GeneralError, RestaurantNotFoundError } from "../../errors";

/**
 * Service layer for reservation management
 * Wraps ZenchefService and uses plain types for internal operations
 */
@Injectable()
export class ReservationsService {
    private readonly logger = new Logger(ReservationsService.name);
    private readonly bookingIdCache: CacheUtil<Set<string>>;

    constructor(
        private readonly zenchefService: ZenchefService,
        private readonly restaurantService: RestaurantService
    ) {
        // Initialize cache with 24 hour TTL
        this.bookingIdCache = new CacheUtil<Set<string>>(86400);
    }

    /**
     * Helper method to get restaurant credentials and settings
     */
    private async getRestaurantCredentials(restaurantId: string): Promise<{
        zenchefId: string;
        apiToken: string;
        maxEscalationSeating: number;
    }> {
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
            maxEscalationSeating: restaurant.maxEscalationSeating,
        };
    }

    /**
     * Checks availability for a given date and number of people
     * @param restaurantId - Internal restaurant ID
     * @param date - Date to check (ISO format YYYY-MM-DD)
     * @param numberOfPeople - Number of guests
     * @param time - Optional specific time to check (HH:MM format)
     * @returns Availability information with human-readable description
     */
    async checkAvailability(
        restaurantId: string,
        date: string,
        numberOfPeople: number,
        time?: string
    ): Promise<AvailabilityResponseModel> {
        this.logger.log(
            `Checking availability for restaurant "${restaurantId}" on "${date}" for "${numberOfPeople}" people${time ? ` at "${time}"` : ""}`
        );

        const { zenchefId, apiToken, maxEscalationSeating } =
            await this.getRestaurantCredentials(restaurantId);

        // Check if party size requires manager escalation
        if (numberOfPeople >= maxEscalationSeating) {
            this.logger.log(
                `Party size ${numberOfPeople} >= ${maxEscalationSeating}, requires manager escalation`
            );

            const description =
                `RESERVATION REQUIRES MANAGER CONTACT\n\n` +
                `Party Size: ${numberOfPeople} guests\n` +
                `Requested Date: ${date}${time ? ` at ${time}` : ""}\n\n` +
                `IMPORTANT: Reservations for ${maxEscalationSeating} or more guests cannot be made through the automated system. ` +
                `The customer must contact the restaurant manager directly to arrange this reservation.\n\n` +
                `Please inform the customer that they need to speak with a manager for large party bookings (${maxEscalationSeating}+ guests). ` +
                `The manager will be able to accommodate their needs and discuss special arrangements for larger groups.`;

            return new AvailabilityResponseModel({
                isRequestedSlotAvailable: false,
                // offers: [],
                otherAvailableSlotsForThatDay: [],
                nextAvailableDate: null,
                description,
            });
        }

        // Fetch seating areas from database and filter by maxEscalationSeating
        const allSeatingAreas =
            await this.restaurantService.getSeatingAreasByRestaurantId(
                restaurantId
            );

        const availability = await this.zenchefService.checkAvailability(
            zenchefId,
            apiToken,
            date,
            numberOfPeople,
            allSeatingAreas,
            time
        );

        console.log("availability", availability);
        // Build structured description for LLM
        const parts: string[] = [];

        // Header: Basic request info
        parts.push(
            `AVAILABILITY CHECK: ${numberOfPeople} guests on ${date}${time ? ` at ${time}` : ""}`
        );

        // Section 1: Requested time availability (if time was specified)
        if (time !== undefined) {
            if (availability.isRequestedSlotAvailable === true) {
                parts.push(`\nREQUESTED TIME STATUS: AVAILABLE at ${time}`);

                if (
                    availability.availableRoomTypesOnRequestedTime &&
                    availability.availableRoomTypesOnRequestedTime.length > 0
                ) {
                    parts.push(`SEATING OPTIONS FOR ${time}:`);
                    availability.availableRoomTypesOnRequestedTime.forEach(
                        (room, idx) => {
                            parts.push(
                                `  ${idx + 1}. ${room.name} (ID: ${room.id}, Capacity: ${room.maxCapacity}${room.description ? `, ${room.description}` : ""})`
                            );
                        }
                    );
                } else {
                    parts.push(
                        `WARNING: Time is available but no configured seating areas found in system.`
                    );
                }
            } else {
                parts.push(`\nREQUESTED TIME STATUS: NOT AVAILABLE at ${time}`);
            }
        }

        // Section 2: Available offers
        // if (availability.offers.length > 0) {
        //     parts.push(
        //         `\nAVAILABLE OFFERS (${availability.offers.length} matching your party size):`
        //     );
        //     availability.offers.forEach((offer, idx) => {
        //         parts.push(`  ${idx + 1}. "${offer.name}" (ID: ${offer.id})`);
        //         if (offer.description) {
        //             // Truncate long descriptions
        //             const desc =
        //                 offer.description.length > 100
        //                     ? offer.description.substring(0, 97) + "..."
        //                     : offer.description;
        //             parts.push(`     ${desc}`);
        //         }
        //     });
        // } else {
        //     parts.push(`\nAVAILABLE OFFERS: None matching your party size`);
        // }

        // Section 3: Other available time slots for the day
        if (availability.otherAvailableSlotsForThatDay.length > 0) {
            parts.push(
                `\nOTHER AVAILABLE TIMES ON ${date} (${availability.otherAvailableSlotsForThatDay.length} slots):`
            );
            availability.otherAvailableSlotsForThatDay.forEach((slot) => {
                const seatingList =
                    slot.seatingAreas.length > 0
                        ? slot.seatingAreas.map((s) => s.name).join(", ")
                        : "No configured seating areas";
                parts.push(
                    `  - ${slot.time}: ${slot.seatingAreas.length} seating area(s) [${seatingList}]`
                );
            });
        } else {
            parts.push(`\nOTHER AVAILABLE TIMES ON ${date}: None available`);
        }

        // Section 4: Next available date (if current day has no availability)
        if (availability.nextAvailableDate) {
            parts.push(
                `\nNEXT AVAILABLE DATE: ${availability.nextAvailableDate.date}`
            );
            if (availability.nextAvailableDate.seatingAreas.length > 0) {
                parts.push(
                    `SEATING AREAS ON ${availability.nextAvailableDate.date}:`
                );
                availability.nextAvailableDate.seatingAreas.forEach(
                    (room, idx) => {
                        parts.push(
                            `  ${idx + 1}. ${room.name} (ID: ${room.id}, Capacity: ${room.maxCapacity})`
                        );
                    }
                );
            } else {
                parts.push(
                    `WARNING: Date available but no configured seating areas found.`
                );
            }
        }

        // Section 5: Important notes
        parts.push(`\nIMPORTANT NOTES:`);
        parts.push(
            `- Seating area availability is provided in "availableRoomTypesOnRequestedTime" (for requested time) and "otherAvailableSlotsForThatDay" (per time slot)`
        );
        parts.push(
            `- Use the seating area ID when making a booking to specify the preferred room`
        );
        parts.push(
            `- Each time slot may have different seating areas available based on restaurant configuration`
        );

        const description = parts.join("\n");

        return new AvailabilityResponseModel({
            ...availability,
            description,
        });
    }

    /**
     * Searches for reservations using optional filters: phone, email, date, and/or customer name
     * If no parameters provided, returns recent reservations from cache
     * @param restaurantId - Internal restaurant ID
     * @param phone - Optional customer phone number
     * @param email - Optional customer email address
     * @param date - Optional date filter (ISO format YYYY-MM-DD)
     * @param customerName - Optional customer name for fuzzy search
     * @returns Array of matching reservation items with human-readable description
     */
    async searchReservations(
        restaurantId: string,
        phone?: string,
        email?: string,
        date?: string,
        customerName?: string
    ): Promise<ReservationListResponseModel> {
        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        // If no parameters provided, fetch from cache
        if (!phone && !email && !date && !customerName) {
            this.logger.log(
                `For restaurant "${restaurantId}", fetching recent reservations from cache`
            );

            const cachedBookingIds =
                this.bookingIdCache.get(restaurantId) || new Set<string>();

            if (cachedBookingIds.size === 0) {
                return new ReservationListResponseModel({
                    reservations: [],
                    description:
                        "No recent reservations available. Please search with specific criteria (phone, email, date, or name) to find reservations.",
                });
            }

            // Fetch full details for cached booking IDs
            const reservations = await Promise.all(
                Array.from(cachedBookingIds).map(async (bookingId) => {
                    try {
                        const booking =
                            await this.zenchefService.getBookingById(
                                zenchefId,
                                apiToken,
                                bookingId
                            );

                        return {
                            bookingId: booking.id.toString(),
                            numberOfPeople: booking.nb_guests,
                            date: booking.day,
                            time: booking.time,
                            name: `${booking.firstname} ${booking.lastname}`.trim(),
                            phone: booking.phone_number || "",
                            email: booking.email || undefined,
                            status: booking.status,
                            statusDescription: this.getStatusDescription(
                                booking.status
                            ),
                            seatingArea:
                                booking.shift_slot?.shift?.name || undefined,
                        };
                    } catch (error) {
                        this.logger.warn(
                            `Failed to fetch booking ${bookingId}: ${error}`
                        );
                        return null;
                    }
                })
            );

            const validReservations = reservations.filter(
                (r) => r !== null
            ) as any[];

            let description = `Retrieved ${validReservations.length} recent reservation(s) from cache. `;
            if (validReservations.length > 0) {
                description += `Use specific filters (phone, email, date, or name) to narrow results.`;
            }

            return new ReservationListResponseModel({
                reservations: validReservations,
                description,
            });
        }

        // Normalize phone number if provided
        const normalizedPhone = phone ? normalizePhoneNumber(phone) : undefined;

        const filters: string[] = [];
        if (phone) {
            filters.push(`phone: ${phone}`);
        }
        if (email) {
            filters.push(`email: ${email}`);
        }
        if (date) {
            filters.push(`date: ${date}`);
        }
        if (customerName) {
            filters.push(`name: "${customerName}"`);
        }

        this.logger.log(
            `For restaurant "${restaurantId}", searching reservations with filters: ${filters.join(", ")}`
        );

        const reservations = await this.zenchefService.searchReservations(
            zenchefId,
            apiToken,
            normalizedPhone,
            email,
            date,
            customerName
        );

        console.log("searchReservations", reservations);

        // Cache booking IDs
        if (reservations.length > 0) {
            const existingCache =
                this.bookingIdCache.get(restaurantId) || new Set<string>();
            reservations.forEach((res) => existingCache.add(res.bookingId));
            this.bookingIdCache.set(restaurantId, existingCache);
        }

        // Generate human-readable description
        let description = "Searched for reservations";
        if (filters.length > 0) {
            description += ` with filters (${filters.join(", ")})`;
        }
        description += " (reservations older than 1 week are not shown). ";

        if (reservations.length === 0) {
            description += `No reservations found matching the criteria.`;
        } else if (reservations.length === 1) {
            const res = reservations[0];
            description += `Found 1 matching reservation: Booking ID ${res.bookingId}, ${res.numberOfPeople} people on ${res.date}, status: ${res.statusDescription}`;
            if (res.seatingArea) {
                description += `, seating area: ${res.seatingArea}`;
            }
            description += ".";
        } else {
            description += `Found ${reservations.length} matching reservations. `;
            const summaries = reservations.map((res) => {
                let summary = `${res.date} (${res.numberOfPeople} people, ${res.statusDescription})`;
                return summary;
            });
            description += `Details: ${summaries.join("; ")}.`;
        }

        return new ReservationListResponseModel({
            reservations,
            description,
        });
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
     * @param roomId - Optional seating area ID
     * @param allergies - Optional allergies or dietary restrictions
     * @returns Complete booking object with booking ID and human-readable description
     */
    async createReservation(
        restaurantId: string,
        numberOfCustomers: number,
        phone: string,
        name: string,
        date: string,
        time: string,
        comments?: string,
        email?: string,
        roomId?: string,
        allergies?: string
    ): Promise<BookingObjectModel> {
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone);

        this.logger.log(
            `For restaurant "${restaurantId}", creating reservation for "${numberOfCustomers}" people on "${date}" at "${time}" with name "${name}" and phone "${normalizedPhone}" (original: "${phone}"). Optional comments: "${comments}". Optional email: "${email}". Optional roomId: "${roomId}". Optional allergies: "${allergies}".`
        );

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        let zenchefRoomId: number | undefined;
        if (roomId) {
            const seatingAreas =
                await this.restaurantService.getSeatingAreasByRestaurantId(
                    restaurantId
                );
            const seatingArea = seatingAreas.find((area) => area.id === roomId);
            if (seatingArea) {
                zenchefRoomId = seatingArea.zenchefRoomId;
            }
        }

        const booking = await this.zenchefService.createReservation(
            zenchefId,
            apiToken,
            numberOfCustomers,
            normalizedPhone,
            name,
            date,
            time,
            comments,
            email,
            zenchefRoomId,
            allergies
        );

        console.log("createReservation", booking);

        // Generate human-readable description
        let description = `Successfully created a new reservation. `;
        description += `Booking ID: ${booking.bookingId}. `;
        description += `Customer: ${booking.name} (phone: ${booking.phone}`;
        if (booking.email) {
            description += `, email: ${booking.email}`;
        }
        description += `). `;
        description += `Reservation: ${booking.numberOfCustomers} people on ${booking.date} at ${booking.time}.`;
        if (booking.comments) {
            description += ` Special requests: ${booking.comments}.`;
        }
        if (allergies) {
            description += ` Allergies: ${allergies}.`;
        }

        return new BookingObjectModel({
            ...booking,
            description,
        });
    }

    /**
     * Updates an existing reservation (supports partial updates)
     * @param restaurantId - Internal restaurant ID
     * @param bookingId - Zenchef booking ID
     * @param updates - Partial update data (only provided fields will be updated)
     * @returns Updated booking object with human-readable description
     */
    async updateReservation(
        restaurantId: string,
        bookingId: string,
        updates: {
            numberOfCustomers?: number;
            phone?: string;
            name?: string;
            date?: string;
            time?: string;
            comments?: string;
            email?: string;
            roomId?: string;
            allergies?: string;
        }
    ): Promise<BookingObjectModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", updating reservation "${bookingId}". Updates: ${JSON.stringify(updates)}`
        );

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        // Fetch existing booking to merge with updates
        const existingBooking = await this.zenchefService.getBookingById(
            zenchefId,
            apiToken,
            bookingId
        );

        // Merge existing data with updates
        const existingFullName =
            `${existingBooking.firstname} ${existingBooking.lastname}`.trim();
        const numberOfCustomers =
            updates.numberOfCustomers ?? existingBooking.nb_guests;
        // Normalize phone if provided in updates
        const phone = updates.phone
            ? normalizePhoneNumber(updates.phone)
            : existingBooking.phone_number || "";
        const name = updates.name ?? existingFullName;
        const date = updates.date ?? existingBooking.day;
        const time = updates.time ?? existingBooking.time;
        const comments =
            updates.comments !== undefined
                ? updates.comments
                : existingBooking.comment;
        const email =
            updates.email !== undefined ? updates.email : existingBooking.email;
        const allergies =
            updates.allergies !== undefined
                ? updates.allergies
                : existingBooking.allergies;

        // Handle room ID
        let zenchefRoomId: number | undefined;
        if (updates.roomId !== undefined) {
            const seatingAreas =
                await this.restaurantService.getSeatingAreasByRestaurantId(
                    restaurantId
                );
            const seatingArea = seatingAreas.find(
                (area) => area.id === updates.roomId
            );
            if (seatingArea) {
                zenchefRoomId = seatingArea.zenchefRoomId;
            }
        }

        const booking = await this.zenchefService.updateReservation(
            zenchefId,
            apiToken,
            bookingId,
            numberOfCustomers,
            phone,
            name,
            date,
            time,
            comments || undefined,
            email || undefined,
            zenchefRoomId,
            allergies || undefined
        );

        console.log("updateReservation", booking);

        // Generate human-readable description
        let description = `Successfully updated the reservation. `;
        description += `Booking ID: ${booking.bookingId}. `;
        description += `Updated customer information: ${booking.name} (phone: ${booking.phone}`;
        if (booking.email) {
            description += `, email: ${booking.email}`;
        }
        description += `). `;
        description += `Updated reservation details: ${booking.numberOfCustomers} people on ${booking.date} at ${booking.time}.`;
        if (booking.comments) {
            description += ` Special requests: ${booking.comments}.`;
        }
        if (allergies) {
            description += ` Allergies: ${allergies}.`;
        }

        return new BookingObjectModel({
            ...booking,
            description,
        });
    }

    /**
     * Gets a specific reservation by booking ID
     * @param restaurantId - Internal restaurant ID
     * @param bookingId - Zenchef booking ID
     * @returns Complete booking object with all details
     */
    async getReservationById(
        restaurantId: string,
        bookingId: string
    ): Promise<BookingObjectModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", getting reservation "${bookingId}".`
        );

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        const booking = await this.zenchefService.getBookingById(
            zenchefId,
            apiToken,
            bookingId
        );

        // Map Zenchef booking data to our model
        const fullName = `${booking.firstname} ${booking.lastname}`.trim();

        // Generate human-readable description
        let description = `Reservation details for Booking ID: ${booking.id}. `;
        description += `Customer: ${fullName} (phone: ${booking.phone_number}`;
        if (booking.email) {
            description += `, email: ${booking.email}`;
        }
        description += `). `;
        description += `Reservation: ${booking.nb_guests} people on ${booking.day} at ${booking.time}. `;
        description += `Status: ${this.getStatusDescription(booking.status)}.`;
        if (booking.comment) {
            description += ` Special requests: ${booking.comment}.`;
        }
        if (booking.allergies) {
            description += ` Allergies: ${booking.allergies}.`;
        }
        if (booking.shift_slot?.shift?.name) {
            description += ` Seating area: ${booking.shift_slot.shift.name}.`;
        }

        return new BookingObjectModel({
            bookingId: booking.id.toString(),
            numberOfCustomers: booking.nb_guests,
            phone: booking.phone_number || "",
            name: fullName,
            date: booking.day,
            time: booking.time,
            comments: booking.comment || undefined,
            email: booking.email || undefined,
            status: booking.status,
            description,
        });
    }

    /**
     * Maps Zenchef booking status to human-readable description
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
     * Cancels an existing reservation
     * @param restaurantId - Internal restaurant ID
     * @param bookingId - Zenchef booking ID
     * @returns Cancellation confirmation with human-readable description
     */
    async cancelReservation(
        restaurantId: string,
        bookingId: string
    ): Promise<CancelReservationResponseModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", canceling reservation "${bookingId}".`
        );

        // TEMPORARY TEST RESPONSE - REMOVE AFTER TESTING
        // return {
        //     description: `Successfully cancelled the reservation with Booking ID: ${bookingId}. The reservation has been removed from the system.`,
        // };

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        await this.zenchefService.cancelReservation(
            zenchefId,
            apiToken,
            bookingId
        );

        // Generate human-readable description
        const description = `Successfully cancelled the reservation with Booking ID: ${bookingId}. The reservation has been removed from the system.`;

        return new CancelReservationResponseModel({
            description,
        });
    }
}
