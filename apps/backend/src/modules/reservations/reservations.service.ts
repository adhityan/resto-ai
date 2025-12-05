import { Injectable, Logger } from "@nestjs/common";
import {
    AvailabilityResponseModel,
    BookingObjectModel,
    CancelReservationResponseModel,
    ReservationListResponseModel,
} from "@repo/contracts";
import {
    DatabaseService,
    Reservation,
    ReservationStatus,
    OperationType,
} from "@repo/database";
import { CacheUtil, normalizePhoneNumber } from "@repo/utils";
import { ZenchefService } from "../zenchef/zenchef.service";
import { RestaurantService } from "../restaurant/restaurant.service";
import { CustomerService } from "../customer/customer.service";
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
        private readonly restaurantService: RestaurantService,
        private readonly databaseService: DatabaseService,
        private readonly customerService: CustomerService
    ) {
        // Initialize cache with 24 hour TTL
        this.bookingIdCache = new CacheUtil<Set<string>>(86400);
    }

    /**
     * Maps Zenchef status string to ReservationStatus enum
     */
    private mapStatusToEnum(status: string): ReservationStatus {
        const statusMap: Record<string, ReservationStatus> = {
            waiting: ReservationStatus.WAITING,
            waiting_customer: ReservationStatus.WAITING_CUSTOMER,
            confirmed: ReservationStatus.CONFIRMED,
            canceled: ReservationStatus.CANCELED,
            refused: ReservationStatus.REFUSED,
            arrived: ReservationStatus.ARRIVED,
            seated: ReservationStatus.SEATED,
            over: ReservationStatus.OVER,
            no_shown: ReservationStatus.NO_SHOWN,
        };
        return statusMap[status] || ReservationStatus.WAITING;
    }

    /**
     * Saves or updates a reservation in the local database
     */
    private async syncReservationToDb(
        restaurantId: string,
        bookingId: string,
        data: {
            status?: string;
            date: string;
            time: string;
            numberOfGuests: number;
            customerName: string;
            customerPhone?: string;
            customerEmail?: string;
            comments?: string;
            allergies?: string;
            seatingAreaName?: string;
            callId?: string;
        }
    ): Promise<Reservation> {
        // If callId is provided, validate that the call exists
        if (data.callId) {
            const call = await this.databaseService.call.findUnique({
                where: { id: data.callId },
            });
            if (!call) {
                throw new GeneralError(`Call with id ${data.callId} not found`);
            }
        }

        return this.databaseService.reservation.upsert({
            where: {
                restaurantId_zenchefBookingId: {
                    restaurantId,
                    zenchefBookingId: bookingId,
                },
            },
            update: {
                status: data.status
                    ? this.mapStatusToEnum(data.status)
                    : undefined,
                date: data.date,
                time: data.time,
                numberOfGuests: data.numberOfGuests,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerEmail: data.customerEmail,
                comments: data.comments,
                allergies: data.allergies,
                seatingAreaName: data.seatingAreaName,
                ...(data.callId && { callId: data.callId }),
            },
            create: {
                restaurantId,
                zenchefBookingId: bookingId,
                status: data.status
                    ? this.mapStatusToEnum(data.status)
                    : ReservationStatus.WAITING,
                date: data.date,
                time: data.time,
                numberOfGuests: data.numberOfGuests,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerEmail: data.customerEmail,
                comments: data.comments,
                allergies: data.allergies,
                seatingAreaName: data.seatingAreaName,
                ...(data.callId && { callId: data.callId }),
            },
        });
    }

    /**
     * Helper method to get restaurant credentials and settings
     */
    private async getRestaurantCredentials(restaurantId: string): Promise<{
        zenchefId: string;
        apiToken: string;
        maxSeatingAllowedBeforeEscalation: number;
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
            maxSeatingAllowedBeforeEscalation:
                restaurant.maxSeatingAllowedBeforeEscalation,
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

        const { zenchefId, apiToken, maxSeatingAllowedBeforeEscalation } =
            await this.getRestaurantCredentials(restaurantId);

        // Check if party size requires manager escalation
        if (numberOfPeople >= maxSeatingAllowedBeforeEscalation) {
            this.logger.log(
                `Party size ${numberOfPeople} >= ${maxSeatingAllowedBeforeEscalation}, requires manager escalation`
            );

            const description =
                `RESERVATION REQUIRES MANAGER CONTACT\n\n` +
                `Party Size: ${numberOfPeople} guests\n` +
                `Requested Date: ${date}${time ? ` at ${time}` : ""}\n\n` +
                `IMPORTANT: Reservations for ${maxSeatingAllowedBeforeEscalation} or more guests cannot be made through the automated system. ` +
                `The customer must contact the restaurant manager directly to arrange this reservation.\n\n` +
                `Please inform the customer that they need to speak with a manager for large party bookings (${maxSeatingAllowedBeforeEscalation}+ guests). ` +
                `The manager will be able to accommodate their needs and discuss special arrangements for larger groups.`;

            return new AvailabilityResponseModel({
                isRequestedSlotAvailable: false,
                offers: undefined,
                otherAvailableSlotsForThatDay: [],
                nextAvailableDate: null,
                description,
            });
        }

        // Fetch seating areas from database and filter by maxSeatingAllowedBeforeEscalation
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
                            let roomInfo = `  ${idx + 1}. ${room.name} (ID: ${room.id}, Capacity: ${room.maxCapacity}${room.description ? `, ${room.description}` : ""})`;
                            if (room.paymentRequiredForConfirmation) {
                                roomInfo += ` [PREPAYMENT]`;
                            }
                            if (room.notCancellable) {
                                roomInfo += ` [NON-CANCELLABLE]`;
                            }
                            parts.push(roomInfo);
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

        // Check for prepayment and cancellation flags
        const hasPrepayment = availability.otherAvailableSlotsForThatDay.some(
            (slot) =>
                slot.seatingAreas.some((s) => s.paymentRequiredForConfirmation)
        );
        const hasNonCancellableSlots =
            availability.otherAvailableSlotsForThatDay.some((slot) =>
                slot.seatingAreas.some((s) => s.notCancellable)
            );
        const anyOfferRequired =
            availability.otherAvailableSlotsForThatDay.some(
                (slot) => slot.isOfferRequired
            );

        // Section: Prepayment notice
        if (hasPrepayment) {
            const prepaymentSlot =
                availability.otherAvailableSlotsForThatDay.find((slot) =>
                    slot.seatingAreas.some(
                        (s) => s.paymentRequiredForConfirmation
                    )
                );
            const chargePerGuest =
                prepaymentSlot?.seatingAreas.find(
                    (s) => s.paymentRequiredForConfirmation
                )?.paymentRequiredForConfirmation || 0;
            parts.push(`\nPREPAYMENT NOTICE:`);
            parts.push(
                `A prepayment of €${chargePerGuest / 100} per person is required for this booking.`
            );
            parts.push(
                `Total prepayment: €${(chargePerGuest * numberOfPeople) / 100}`
            );
            parts.push(
                `After booking, a payment link will be sent to the customer's email.`
            );
            parts.push(
                `The reservation will remain PENDING until payment is completed.`
            );
        }

        // Section: Cancellation restriction notice
        if (hasNonCancellableSlots) {
            parts.push(`\nCANCELLATION RESTRICTION:`);
            parts.push(
                `Some time slots are marked as "notCancellable: true" in their seating areas.`
            );
            parts.push(
                `Bookings for these slots cannot be cancelled by the customer after creation.`
            );
        }

        // Section: Offer requirement notice
        if (anyOfferRequired) {
            parts.push(`\nOFFER REQUIREMENT:`);
            parts.push(
                `Some time slots require selecting an offer (isOfferRequired: true).`
            );
            parts.push(
                `Check the "requiredOfferIds" field for valid offer IDs.`
            );
            parts.push(
                `Include "offerId" when creating a reservation for these slots.`
            );
        }

        // Section 2: Available offers (only show if offers exist)
        if (availability.offers && availability.offers.length > 0) {
            parts.push(
                `\nAVAILABLE OFFERS (${availability.offers.length} matching your party size):`
            );
            availability.offers.forEach((offer, idx) => {
                parts.push(`  ${idx + 1}. "${offer.name}" (ID: ${offer.id})`);
                if (offer.description) {
                    // Truncate long descriptions
                    const desc =
                        offer.description.length > 100
                            ? offer.description.substring(0, 97) + "..."
                            : offer.description;
                    parts.push(`     ${desc}`);
                }
            });
        }

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
                let slotInfo = `  - ${slot.time}: ${slot.seatingAreas.length} seating area(s) [${seatingList}]`;

                // Add offer requirement indicator
                if (slot.isOfferRequired) {
                    slotInfo += ` [OFFER REQUIRED - IDs: ${slot.requiredOfferIds?.join(", ")}]`;
                }

                // Add prepayment/cancellation indicators
                const slotHasPayment = slot.seatingAreas.some(
                    (s) => s.paymentRequiredForConfirmation
                );
                const slotHasNonCancel = slot.seatingAreas.some(
                    (s) => s.notCancellable
                );
                if (slotHasPayment) slotInfo += ` [PREPAYMENT]`;
                if (slotHasNonCancel) slotInfo += ` [NON-CANCELLABLE]`;

                parts.push(slotInfo);
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
            `- Use seating area ID when making a booking to specify preferred room`
        );
        if (anyOfferRequired) {
            parts.push(
                `- Include "offerId" for time slots marked with isOfferRequired: true`
            );
        }
        if (hasPrepayment) {
            parts.push(
                `- Bookings with prepayment will be PENDING until payment is completed`
            );
        }
        if (hasNonCancellableSlots) {
            parts.push(
                `- Non-cancellable bookings cannot be cancelled by the customer`
            );
        }

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

        // Log search operation
        await this.databaseService.operationLog.create({
            data: { type: OperationType.SEARCH_RESERVATION, restaurantId },
        });

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
     * @param callId - Optional call ID to associate with the reservation
     * @param offerId - Optional offer ID (required when is_offer_required is true)
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
        allergies?: string,
        callId?: string,
        offerId?: number
    ): Promise<BookingObjectModel> {
        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone);

        this.logger.log(
            `For restaurant "${restaurantId}", creating reservation for "${numberOfCustomers}" people on "${date}" at "${time}" with name "${name}" and phone "${normalizedPhone}" (original: "${phone}"). Optional comments: "${comments}". Optional email: "${email}". Optional roomId: "${roomId}". Optional allergies: "${allergies}". Optional callId: "${callId}". Optional offerId: "${offerId}".`
        );

        // Step 1: Check availability to determine offer requirements
        const availability = await this.checkAvailability(
            restaurantId,
            date,
            numberOfCustomers,
            time
        );

        // Step 2: Find the requested time slot in availability response
        const requestedSlot = availability.otherAvailableSlotsForThatDay.find(
            (slot) => slot.time === time
        );

        // Step 3: Validate offer requirement
        if (requestedSlot?.isOfferRequired) {
            if (!offerId) {
                const validOfferIds =
                    requestedSlot.requiredOfferIds?.join(", ") || "none";
                throw new GeneralError(
                    `An offer must be selected for this time slot. Valid offer IDs: ${validOfferIds}`
                );
            }

            if (
                requestedSlot.requiredOfferIds &&
                !requestedSlot.requiredOfferIds.includes(offerId)
            ) {
                throw new GeneralError(
                    `Invalid offer ID ${offerId}. Valid offers for this slot: ${requestedSlot.requiredOfferIds.join(", ")}`
                );
            }
        }

        // Step 4: Upsert customer (phone is the unique identifier)
        await this.customerService.upsertCustomer(restaurantId, {
            phone: normalizedPhone,
            name,
            email,
        });

        const { zenchefId, apiToken } =
            await this.getRestaurantCredentials(restaurantId);

        // Step 5: Get Zenchef room ID if roomId provided
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

        // Step 6: Create the booking with optional offer
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
            allergies,
            offerId
        );

        // Step 7: Check if prepayment was required
        const hasPrepayment = requestedSlot?.seatingAreas.some(
            (area) => area.paymentRequiredForConfirmation
        );

        if (hasPrepayment) {
            try {
                const fullBooking = await this.zenchefService.getBookingById(
                    zenchefId,
                    apiToken,
                    booking.bookingId
                );

                if (fullBooking.url) {
                    this.logger.log(
                        `Prepayment URL for booking ${booking.bookingId}: ${fullBooking.url}`
                    );
                } else {
                    this.logger.log(
                        `Prepayment required for booking ${booking.bookingId} but no URL received yet`
                    );
                }
            } catch (error) {
                this.logger.warn(
                    `Failed to fetch booking details for prepayment URL: ${error}`
                );
            }
        }

        // Step 8: Sync to local database
        await this.syncReservationToDb(restaurantId, booking.bookingId, {
            status: booking.status,
            date: booking.date,
            time: booking.time,
            numberOfGuests: booking.numberOfCustomers,
            customerName: booking.name,
            customerPhone: booking.phone,
            customerEmail: booking.email,
            comments: booking.comments,
            allergies: allergies,
            seatingAreaName: booking.seatingAreaName,
            callId,
        });

        this.logger.log(
            `Created and synced reservation ${booking.bookingId} to local database`
        );

        // Step 9: Log create operation
        await this.databaseService.operationLog.create({
            data: { type: OperationType.CREATE_RESERVATION, restaurantId },
        });

        // Step 10: Generate human-readable description (includes offer info)
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
        if (offerId && availability.offers) {
            const selectedOffer = availability.offers.find(
                (o) => o.id === offerId
            );
            description += ` Selected offer: ${selectedOffer?.name || `ID ${offerId}`}.`;
        }
        if (hasPrepayment) {
            description += ` PREPAYMENT REQUIRED: A payment link has been sent to the customer's email.`;
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
            offerId?: number;
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
        const offerId = updates.offerId;

        // Validate offer if date or time is changing
        if (updates.date || updates.time) {
            const availability = await this.checkAvailability(
                restaurantId,
                date,
                numberOfCustomers,
                time
            );

            const requestedSlot =
                availability.otherAvailableSlotsForThatDay.find(
                    (slot) => slot.time === time
                );

            if (requestedSlot?.isOfferRequired) {
                // Check if existing booking has an offer
                const existingOfferId =
                    existingBooking.booking_offers?.[0]?.offer_id;
                const effectiveOfferId = offerId ?? existingOfferId;

                if (!effectiveOfferId) {
                    throw new GeneralError(
                        `An offer must be selected for this time slot. Valid offer IDs: ${requestedSlot.requiredOfferIds?.join(", ")}`
                    );
                }

                if (
                    requestedSlot.requiredOfferIds &&
                    !requestedSlot.requiredOfferIds.includes(effectiveOfferId)
                ) {
                    throw new GeneralError(
                        `Invalid offer ID ${effectiveOfferId}. Valid offers for this slot: ${requestedSlot.requiredOfferIds.join(", ")}`
                    );
                }
            }
        }

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
            allergies || undefined,
            offerId
        );

        // Sync to local database
        await this.syncReservationToDb(restaurantId, booking.bookingId, {
            status: booking.status,
            date: booking.date,
            time: booking.time,
            numberOfGuests: booking.numberOfCustomers,
            customerName: booking.name,
            customerPhone: booking.phone,
            customerEmail: booking.email,
            comments: booking.comments,
            allergies: allergies || undefined,
            seatingAreaName: booking.seatingAreaName,
        });

        this.logger.log(
            `Updated and synced reservation ${booking.bookingId} to local database`
        );

        // Log update operation
        await this.databaseService.operationLog.create({
            data: { type: OperationType.UPDATE_RESERVATION, restaurantId },
        });

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
     * Extracts offer details from a Zenchef booking
     * Since customer can only select ONE offer, we take the first item
     */
    private extractOfferFromBooking(booking: {
        booking_offers?: Array<{
            offer_id: number;
            offer_data?: {
                name?: string;
                description?: string;
            };
        }>;
    }): {
        offerId?: number;
        offerName?: string;
        offerDescription?: string;
    } {
        const bookingOffer = booking.booking_offers?.[0];

        if (!bookingOffer) {
            return {};
        }

        return {
            offerId: bookingOffer.offer_id,
            offerName: bookingOffer.offer_data?.name,
            offerDescription: bookingOffer.offer_data?.description,
        };
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

        // Extract offer details
        const offerDetails = this.extractOfferFromBooking(booking);

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
        // Include offer in description
        if (offerDetails.offerName) {
            description += ` Selected offer: ${offerDetails.offerName}.`;
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
            // Include offer details
            offerId: offerDetails.offerId,
            offerName: offerDetails.offerName,
            offerDescription: offerDetails.offerDescription,
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

        // Update status in local database
        await this.databaseService.reservation.updateMany({
            where: {
                restaurantId,
                zenchefBookingId: bookingId,
            },
            data: {
                status: ReservationStatus.CANCELED,
            },
        });

        this.logger.log(
            `Cancelled and synced reservation ${bookingId} to local database`
        );

        // Log cancel operation
        await this.databaseService.operationLog.create({
            data: { type: OperationType.CANCEL_RESERVATION, restaurantId },
        });

        // Generate human-readable description
        const description = `Successfully cancelled the reservation with Booking ID: ${bookingId}. The reservation has been removed from the system.`;

        return new CancelReservationResponseModel({
            description,
        });
    }

    /**
     * Get all reservations from local database (for Admin UI)
     */
    async getReservationsFromDb(
        restaurantId?: string,
        date?: string,
        status?: ReservationStatus[],
        skip = 0,
        take = 50
    ): Promise<{ items: Reservation[]; total: number }> {
        const where: any = {};

        if (restaurantId) {
            where.restaurantId = restaurantId;
        }

        if (date) {
            where.date = date;
        }

        if (status && status.length > 0) {
            where.status = { in: status };
        }

        const [items, total] = await Promise.all([
            this.databaseService.reservation.findMany({
                where,
                include: { restaurant: true },
                orderBy: [{ date: "desc" }, { time: "desc" }],
                skip,
                take,
            }),
            this.databaseService.reservation.count({ where }),
        ]);

        return { items, total };
    }

    /**
     * Get a single reservation from local database by ID (for Admin UI)
     */
    async getReservationFromDbById(
        id: string
    ): Promise<
        (Reservation & { restaurant: { id: string; name: string } }) | null
    > {
        return this.databaseService.reservation.findUnique({
            where: { id },
            include: { restaurant: { select: { id: true, name: true } } },
        });
    }

    /**
     * Get a single reservation from local database by Zenchef booking ID
     */
    async getReservationFromDbByBookingId(
        restaurantId: string,
        zenchefBookingId: string
    ): Promise<Reservation | null> {
        return this.databaseService.reservation.findUnique({
            where: {
                restaurantId_zenchefBookingId: {
                    restaurantId,
                    zenchefBookingId,
                },
            },
        });
    }
}
