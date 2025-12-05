import { llm } from "@livekit/agents";
import { z } from "zod";
import type { AxiosInstance } from "axios";
import { getErrorMessage } from "../utils/http.js";

export function createMakeReservationTool(client: AxiosInstance) {
    return llm.tool({
        description: `Create a new reservation. Only call after: (1) checking availability and confirming a slot is available, (2) collecting all required information (name, phone, email, date, time, party size), and (3) verbally confirming details with the customer. For time, guide customers to book at :00, :15, :30, or :45 intervals.

OFFER REQUIREMENT: If the availability check showed "isOfferRequired: true" for the time slot, you MUST include an offerId from the "requiredOfferIds" array. Present the available offers to the customer and let them choose.

PREPAYMENT: If prepayment is required (paymentRequiredForConfirmation), inform customer that a payment link will be sent to their email. The reservation response status will be "waiting" until payment is completed.

RESPONSE: Includes "description" with booking confirmation, "canModify"/"canCancel" flags, and "seatingAreaName".`,
        parameters: z.object({
            date: z
                .string()
                .describe(
                    "Reservation date in ISO format YYYY-MM-DD. Convert natural language (e.g., 'this Saturday', 'December 25th') to this format."
                ),
            time: z
                .string()
                .describe(
                    "Arrival time in 24-hour HH:MM format (e.g., '19:00', '20:30'). Prefer times ending in :00, :15, :30, or :45."
                ),
            phone: z
                .string()
                .describe(
                    "Customer's phone number. Any format is acceptable — the system will normalize it automatically."
                ),
            allergies: z
                .string()
                .optional()
                .describe(
                    "Dietary restrictions, food allergies, or special dietary requirements. Examples: 'Gluten-free', 'No shellfish', 'Peanut allergy'."
                ),
            comments: z
                .string()
                .optional()
                .describe(
                    "Special requests, accessibility needs, or occasion notes. Do NOT include dietary restrictions or allergies here."
                ),
            numberOfCustomers: z
                .number()
                .describe(
                    "Total party size including the caller. Infer from context: 'table for two' = 2, 'me and three friends' = 4."
                ),
            email: z
                .string()
                .describe(
                    "Customer's email address (required). Format: 'user@example.com'."
                ),
            roomId: z
                .string()
                .optional()
                .describe(
                    "The UUID of the room if a special seating request was mentioned. Only include if explicitly confirmed with customer."
                ),
            name: z
                .string()
                .describe(
                    "Customer's full name (first and last). Ensure you have both first and last name."
                ),
            offerId: z
                .number()
                .optional()
                .describe(
                    "ID of the selected offer. REQUIRED when the time slot has isOfferRequired: true. Must be one of the IDs from requiredOfferIds array. Present the offers to the customer and include their chosen offer ID."
                ),
        }),
        execute: async (payload) => {
            try {
                const { data } = await client.post("/reservations", payload);
                return data;
            } catch (error) {
                throw new Error(`error: ${getErrorMessage(error)}`);
            }
        },
    });
}
