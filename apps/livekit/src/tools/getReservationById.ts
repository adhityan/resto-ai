import { llm } from "@livekit/agents";
import { z } from "zod";
import type { AxiosInstance } from "axios";
import { getErrorMessage } from "../utils/http.js";

export function createGetReservationByIdTool(client: AxiosInstance) {
    return llm.tool({
        description: `Get full details of a specific reservation by its booking ID. Use when you need complete information about a reservation you already have the ID for.

RESPONSE: Includes "description" with reservation details, customer info, date/time, status, and offer info if applicable.`,
        parameters: z.object({
            bookingId: z
                .string()
                .describe(
                    "Unique booking identifier obtained from search-reservations or a previous booking operation."
                ),
        }),
        execute: async ({ bookingId }) => {
            try {
                const { data } = await client.get(
                    `/reservations/${encodeURIComponent(bookingId)}`
                );
                return data;
            } catch (error) {
                throw new Error(`error: ${getErrorMessage(error)}`);
            }
        },
    });
}

