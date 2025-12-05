import { llm } from "@livekit/agents";
import { z } from "zod";
import type { AxiosInstance } from "axios";
import { getErrorMessage } from "../utils/http.js";

export function createSearchReservationsTool(client: AxiosInstance) {
    return llm.tool({
        description: `Search for reservations using any combination of phone, email, name, and/or date. All parameters are optional - you can call this tool with any subset of parameters or even without any parameters to get recently made reservations. Uses fuzzy matching on names. Empty result means no matching reservations found.

NOTE: Only searches reservations from the last 7 days. Older reservations are not returned.

RESPONSE: Includes "description" with search summary. Each reservation includes:
- "canModify" / "canCancel" flags - check these before attempting modifications or cancellations
- "statusDescription" - human-readable status
- "offerId", "offerName", "offerDescription" if an offer was selected during booking`,
        parameters: z.object({
            date: z
                .string()
                .optional()
                .describe(
                    "Reservation date in ISO format YYYY-MM-DD. Use when customer mentions a specific date."
                ),
            email: z
                .string()
                .optional()
                .describe(
                    "Customer's email address. Example: 'john.smith@example.com'."
                ),
            phone: z
                .string()
                .optional()
                .describe(
                    "Customer's phone number in any format - the system will normalize it automatically."
                ),
            customerName: z
                .string()
                .optional()
                .describe(
                    "Customer's full name as provided. Fuzzy matching will find similar spellings."
                ),
        }),
        execute: async (payload) => {
            try {
                const { data } = await client.post(
                    "/reservations/search",
                    payload
                );
                return data;
            } catch (error) {
                throw new Error(`error: ${getErrorMessage(error)}`);
            }
        },
    });
}
