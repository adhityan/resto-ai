import { llm } from "@livekit/agents";
import { z } from "zod";
import type { AxiosInstance } from "axios";
import { getErrorMessage } from "../utils/http.js";

export function createUpdateReservationTool(client: AxiosInstance) {
    return llm.tool({
        description: `Modify an existing reservation. Supports partial updates—only include fields you want to change. Only call after: (1) retrieving the booking via search-reservations to obtain bookingId, (2) checking availability if changing date/time/party size, (3) confirming the update details with customer.

IMPORTANT: If changing date or time to a slot with "isOfferRequired: true", you must include an offerId from the requiredOfferIds array. The existing offer on the booking may be reused if it's in the valid list, otherwise present offers to customer.`,
        parameters: z.object({
            bookingId: z
                .string()
                .describe(
                    "Unique booking identifier obtained from search-reservations tool response. Required to identify which reservation to update."
                ),
            date: z
                .string()
                .optional()
                .describe(
                    "New reservation date in ISO format YYYY-MM-DD. Only include if customer wants to change the date."
                ),
            time: z
                .string()
                .optional()
                .describe(
                    "New arrival time in 24-hour HH:MM format. Prefer :00, :15, :30, or :45 intervals. Examples: '19:00', '20:30'."
                ),
            phone: z
                .string()
                .optional()
                .describe(
                    "New phone number. Only include if customer wants to update their contact number."
                ),
            allergies: z
                .string()
                .optional()
                .describe(
                    "New or updated dietary restrictions, food allergies, or special dietary requirements. Examples: 'Gluten-free', 'No shellfish', 'Peanut allergy'."
                ),
            comments: z
                .string()
                .optional()
                .describe(
                    "New or additional special requests (occasions, accessibility needs). Do NOT include dietary restrictions—use the allergies field."
                ),
            numberOfCustomers: z
                .number()
                .optional()
                .describe(
                    "New party size including the caller. Only include if customer wants to change the number of guests."
                ),
            email: z
                .string()
                .optional()
                .describe(
                    "Customer's new email address if customer provides it during update. Format: 'user@example.com'."
                ),
            roomId: z
                .string()
                .optional()
                .describe(
                    "The UUID of the room if a special seating request was mentioned. Only include if explicitly confirmed with customer."
                ),
            name: z
                .string()
                .optional()
                .describe(
                    "New customer name. Only include if customer wants to change the name on the reservation."
                ),
            offerId: z
                .number()
                .optional()
                .describe(
                    "ID of the selected offer. Required when changing date/time to a slot with isOfferRequired: true. Must be one of the IDs from requiredOfferIds array."
                ),
        }),
        execute: async ({ bookingId, ...payload }) => {
            try {
                const { data } = await client.put(
                    `/reservations/${encodeURIComponent(bookingId)}`,
                    payload
                );
                return data;
            } catch (error) {
                throw new Error(`error: ${getErrorMessage(error)}`);
            }
        },
    });
}
