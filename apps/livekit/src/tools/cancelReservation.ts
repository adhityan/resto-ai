import { llm } from "@livekit/agents";
import { z } from "zod";
import type { AxiosInstance } from "axios";
import { getErrorMessage } from "../utils/http.js";

export function createCancelReservationTool(client: AxiosInstance) {
    return llm.tool({
        description: `Cancel an existing reservation permanently. Only call after: (1) retrieving the booking via search-reservations to obtain bookingId, (2) confirming the reservation details with customer, (3) getting explicit confirmation to cancel.`,
        parameters: z.object({
            bookingId: z
                .string()
                .describe(
                    "Unique booking identifier obtained from search-reservations tool response. Example format: 'bk_abc123xyz'. CRITICAL: Always confirm cancellation details with customer before calling this tool."
                ),
        }),
        execute: async ({ bookingId }) => {
            try {
                const { data } = await client.delete(
                    `/reservations/${encodeURIComponent(bookingId)}`
                );
                return data;
            } catch (error) {
                throw new Error(`error: ${getErrorMessage(error)}`);
            }
        },
    });
}
