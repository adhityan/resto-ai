import { Injectable, Logger } from "@nestjs/common";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    CancelReservationResponseModel,
    ReservationListResponseModel,
} from "@repo/contracts";
import { ZenchefService } from "../zenchef/zenchef.service";

/**
 * Service layer for reservation management
 * Wraps ZenchefService and uses plain types for internal operations
 */
@Injectable()
export class ReservationsService {
    private readonly logger = new Logger(ReservationsService.name);

    constructor(private readonly zenchefService: ZenchefService) {}

    /**
     * Checks availability for a given date and number of people
     * @param restaurantId - Internal restaurant ID
     * @param date - Date to check (ISO format YYYY-MM-DD)
     * @param numberOfPeople - Number of guests
     * @param time - Optional specific time to check (HH:MM format)
     * @param seatingPreference - Optional seating area preference
     * @returns Availability information with human-readable description
     */
    async checkAvailability(
        restaurantId: string,
        date: string,
        numberOfPeople: number,
        time?: string,
        seatingPreference?: string
    ): Promise<AvailabilityResponseModel> {
        this.logger.log(
            `Checking availability for restaurant "${restaurantId}" on "${date}" for "${numberOfPeople}" people${time ? ` at "${time}"` : ""}${seatingPreference ? ` (preference: "${seatingPreference}")` : ""}`
        );

        const availability = await this.zenchefService.checkAvailability(
            restaurantId,
            date,
            numberOfPeople,
            time,
            seatingPreference
        );

        console.log("availability", availability);
        // Generate human-readable description
        let description = `Availability check for ${numberOfPeople} people on ${date}`;

        if (time) {
            description += ` at ${time}`;
        }
        if (seatingPreference) {
            description += ` in ${seatingPreference} seating area`;
        }
        description += ". ";

        if (availability.isRequestedSlotAvailable === true) {
            description += `The requested time slot is AVAILABLE.`;
        } else if (availability.isRequestedSlotAvailable === false) {
            description += `The requested time slot is NOT AVAILABLE.`;
        }

        if (availability.otherAvailableSlotsForThatDay.length > 0) {
            description += ` Other available time slots for this date: ${availability.otherAvailableSlotsForThatDay.join(", ")}.`;
        } else if (availability.isRequestedSlotAvailable !== true) {
            description += ` No other time slots are available on this date.`;
        }

        if (availability.nextAvailableDate) {
            description += ` Next available date: ${availability.nextAvailableDate}.`;
        } else if (
            availability.otherAvailableSlotsForThatDay.length === 0 &&
            availability.isRequestedSlotAvailable !== true
        ) {
            description += ` No future availability found in the next 30 days.`;
        }

        return {
            ...availability,
            description,
        };
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

        const reservations = await this.zenchefService.getReservationByPhone(
            restaurantId,
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

        return {
            reservations,
            description,
        };
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

        const reservations = await this.zenchefService.searchReservations(
            restaurantId,
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

        return {
            reservations,
            description,
        };
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
        seatingPreference?: string
    ): Promise<BookingObjectModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", creating reservation for "${numberOfCustomers}" people on "${date}" at "${time}" in "${seatingPreference}" seating area with name "${name}" and phone "${phone}". Optional comments: "${comments}". Optional email: "${email}".`
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

        const booking = await this.zenchefService.createReservation(
            restaurantId,
            numberOfCustomers,
            phone,
            name,
            date,
            time,
            comments,
            email,
            seatingPreference
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
        description += `Reservation: ${booking.numberOfCustomers} people on ${booking.date} at ${booking.time}`;
        if (booking.seatingPreference) {
            description += ` in ${booking.seatingPreference} seating area`;
        }
        description += ".";
        if (booking.comments) {
            description += ` Special requests: ${booking.comments}.`;
        }

        return {
            ...booking,
            description,
        };
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
        seatingPreference?: string
    ): Promise<BookingObjectModel> {
        this.logger.log(
            `For restaurant "${restaurantId}", updating reservation "${bookingId}". Number of customers: "${numberOfCustomers}". Phone: "${phone}". Name: "${name}". Date: "${date}". Time: "${time}". Optional comments: "${comments}". Optional email: "${email}". Optional seating preference: "${seatingPreference}".`
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

        const booking = await this.zenchefService.updateReservation(
            restaurantId,
            bookingId,
            numberOfCustomers,
            phone,
            name,
            date,
            time,
            comments,
            email,
            seatingPreference
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
        description += `Updated reservation details: ${booking.numberOfCustomers} people on ${booking.date} at ${booking.time}`;
        if (booking.seatingPreference) {
            description += ` in ${booking.seatingPreference} seating area`;
        }
        description += ".";
        if (booking.comments) {
            description += ` Special requests: ${booking.comments}.`;
        }

        return {
            ...booking,
            description,
        };
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

        await this.zenchefService.cancelReservation(restaurantId, bookingId);

        // Generate human-readable description
        const description = `Successfully cancelled the reservation with Booking ID: ${bookingId}. The reservation has been removed from the system.`;

        return {
            description,
        };
    }
}
