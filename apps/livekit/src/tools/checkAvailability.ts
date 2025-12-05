import { llm } from "@livekit/agents";
import { z } from "zod";
import type { AxiosInstance } from "axios";
import { getErrorMessage } from "../utils/http.js";

export function createCheckAvailabilityTool(client: AxiosInstance) {
    return llm.tool({
        description: `Check available time slots for a specific date. Call this after gathering the date and party size from the customer. Optionally include time if provided. Infer values from natural conversation. Examples: 'table for me and my girlfriend' = 2 people, 'tomorrow evening' = tomorrow's date + evening time range.

RESPONSE:
- "description" field contains a detailed summary of availability
- "nextAvailableDate" is returned when no slots are available on the requested day
- For 11+ guests, returns manager escalation response (do not proceed with booking - transfer to manager)

TIME SLOT FLAGS:
- "isOfferRequired" and "requiredOfferIds" - when true, customer must select an offer from the "offers" array
- "paymentRequiredForConfirmation" on seating areas - prepayment required, customer receives payment link via email
- "notCancellable" on seating areas - booking cannot be cancelled after creation`,
        parameters: z.object({
            date: z
                .string()
                .describe(
                    "Reservation date in ISO format YYYY-MM-DD. Convert natural language (e.g., 'tomorrow', 'next Friday', 'December 25th') to this format."
                ),
            time: z
                .string()
                .optional()
                .describe(
                    "Preferred time in 24-hour HH:MM format (e.g., '19:00' for 7pm, '20:30' for 8:30pm). Only include if customer specifies a time."
                ),
            numberOfPeople: z
                .number()
                .describe(
                    "Total party size including the caller. Infer from context: 'me and my girlfriend' = 2, 'table for four' = 4."
                ),
        }),
        execute: async (payload) => {
            try {
                const { data } = await client.post(
                    "/reservations/check-availability",
                    payload
                );
                return data;
            } catch (error) {
                throw new Error(`error: ${getErrorMessage(error)}`);
            }
        },
    });
}
