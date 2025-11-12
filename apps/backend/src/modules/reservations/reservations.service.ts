import { Injectable, Logger } from "@nestjs/common";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    CancelReservationResponseModel,
    ReservationListResponseModel,
} from "@repo/contracts";
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

    constructor(
        private readonly zenchefService: ZenchefService,
        private readonly restaurantService: RestaurantService
    ) {}

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
                offers: [],
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
        const seatingAreas = allSeatingAreas.filter(
            (area) => area.maxCapacity < maxEscalationSeating
        );

        const availability = await this.zenchefService.checkAvailability(
            zenchefId,
            apiToken,
            date,
            numberOfPeople,
            seatingAreas,
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
     * Retrieves reservations by customer phone number
     * @param restaurantId - Internal restaurant ID
     * @param phone - Customer phone number
     * @param date - Optional date filter (ISO format YYYY-MM-DD)
     * @returns Array of reservation items with human-readable description
     */
    async getReservationByPhone(
        restaurantId: string,
        phone: string,
        date?: string
    ): Promise<ReservationListResponseModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", getting reservations by phone "${phone}" ${date ? ` for date "${date}"` : ""}`
        );

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        const reservations = await this.zenchefService.getReservationByPhone(
            zenchefId,
            apiToken,
            phone,
            date
        );

        console.log("getReservationByPhone", reservations);
        // Generate human-readable description
        let description = `Searched for reservations with phone number ${phone}`;
        if (date) {
            description += ` on ${date}`;
        }
        description += " (reservations older than 1 week are not shown). ";

        if (reservations.length === 0) {
            description += `No reservations found.`;
        } else if (reservations.length === 1) {
            const res = reservations[0];
            description += `Found 1 reservation: Booking ID ${res.bookingId}, ${res.numberOfPeople} people on ${res.date}, status: ${res.statusDescription}`;
            if (res.seatingArea) {
                description += `, seating area: ${res.seatingArea}`;
            }
            description += ".";
        } else {
            description += `Found ${reservations.length} reservations. `;
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
     * Searches for reservations by optional date and customer name
     * @param restaurantId - Internal restaurant ID
     * @param date - Optional date filter (ISO format YYYY-MM-DD)
     * @param customerName - Optional customer name for fuzzy search
     * @returns Array of matching reservation items with human-readable description
     */
    async searchReservations(
        restaurantId: string,
        date?: string,
        customerName?: string
    ): Promise<ReservationListResponseModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", searching reservations${date ? ` for date "${date}"` : ""}${customerName ? ` with name "${customerName}"` : ""}`
        );

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        const reservations = await this.zenchefService.searchReservations(
            zenchefId,
            apiToken,
            date,
            customerName
        );

        console.log("searchReservations", reservations);
        // Generate human-readable description
        let description = "Searched for reservations";
        const filters: string[] = [];
        if (date) {
            filters.push(`date: ${date}`);
        }
        if (customerName) {
            filters.push(`customer name: "${customerName}"`);
        }

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
        roomId?: string
    ): Promise<BookingObjectModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", creating reservation for "${numberOfCustomers}" people on "${date}" at "${time}" with name "${name}" and phone "${phone}". Optional comments: "${comments}". Optional email: "${email}". Optional roomId: "${roomId}".`
        );

        // TEMPORARY TEST RESPONSE - REMOVE AFTER TESTING
        // return {
        //     bookingId: "TEST_BOOKING_123",
        //     numberOfCustomers,
        //     phone,
        //     name,
        //     date,
        //     time,
        //     comments,
        //     email,
        //     seatingPreference,
        //     description: `Successfully created a new reservation. Booking ID: 512345. Customer: ${name} (phone: ${phone}${email ? `, email: ${email}` : ""}). Reservation: ${numberOfCustomers} people on ${date} at ${time}${seatingPreference ? ` in ${seatingPreference} seating area` : ""}.${comments ? ` Special requests: ${comments}.` : ""}`,
        // };

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
            phone,
            name,
            date,
            time,
            comments,
            email,
            zenchefRoomId
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

        return new BookingObjectModel({
            ...booking,
            description,
        });
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
     * @param roomId - Optional seating area ID
     * @returns Updated booking object with human-readable description
     */
    async updateReservation(
        restaurantId: string,
        bookingId: string,
        numberOfCustomers: number,
        phone: string,
        name: string,
        date: string,
        time: string,
        comments?: string,
        email?: string,
        roomId?: string
    ): Promise<BookingObjectModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", updating reservation "${bookingId}". Number of customers: "${numberOfCustomers}". Phone: "${phone}". Name: "${name}". Date: "${date}". Time: "${time}". Optional comments: "${comments}". Optional email: "${email}". Optional roomId: "${roomId}".`
        );

        // // TEMPORARY TEST RESPONSE - REMOVE AFTER TESTING
        // return {
        //     bookingId,
        //     numberOfCustomers,
        //     phone,
        //     name,
        //     date,
        //     time,
        //     comments,
        //     email,
        //     seatingPreference,
        //     description: `Successfully updated the reservation. Booking ID: ${bookingId}. Updated customer information: ${name} (phone: ${phone}${email ? `, email: ${email}` : ""}). Updated reservation details: ${numberOfCustomers} people on ${date} at ${time}${seatingPreference ? ` in ${seatingPreference} seating area` : ""}.${comments ? ` Special requests: ${comments}.` : ""}`,
        // };

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

        const booking = await this.zenchefService.updateReservation(
            zenchefId,
            apiToken,
            bookingId,
            numberOfCustomers,
            phone,
            name,
            date,
            time,
            comments,
            email,
            zenchefRoomId
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

        return new BookingObjectModel({
            ...booking,
            description,
        });
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
