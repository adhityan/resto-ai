import { llm } from "@livekit/agents";
import type { AxiosInstance } from "axios";
import { endCall } from "../utils/call.js";
import { getErrorMessage } from "../utils/http.js";

/**
 * Creates a tool to transfer the call to the restaurant manager.
 *
 * TODO: Implement actual SIP REFER transfer using LiveKit's TransferSIPParticipant API
 * See: https://docs.livekit.io/sip/transfer-cold/
 *
 * Currently this is a placeholder that ends the call.
 * Future implementation should use:
 * - sipClient.transferSipParticipant(roomName, participantIdentity, `tel:${managerPhone}`)
 */
export function createTransferToManagerTool(
    client: AxiosInstance,
    callId: string,
    roomName: string,
    _managerPhone: string // Prefixed with _ to indicate unused for now
) {
    return llm.tool({
        description: `Transfer the call to the restaurant manager. Use this for:
- Large party bookings (11+ guests)
- Non-cancellable reservations (canCancel: false)
- Repeated system failures
- Any situation requiring human assistance

No parameters needed - the manager's number is configured automatically. Say something like "Ok. Let me connect you with our manager" before calling this tool.`,
        execute: async () => {
            // Log escalation to database
            try {
                await client.post(
                    `/calls/${encodeURIComponent(callId)}/escalate`,
                    {}
                );
            } catch (error) {
                console.error(
                    `Failed to log escalation: ${getErrorMessage(error)}`
                );
            }

            // TODO: Implement actual SIP transfer
            // const sipClient = new SipClient(LIVEKIT_URL, API_KEY, API_SECRET);
            // await sipClient.transferSipParticipant(roomName, participantIdentity, `tel:${managerPhone}`);

            // For now, just end the call
            console.log(
                `Transfer requested to manager. Ending call for room: ${roomName}`
            );
            await endCall(roomName, client, callId);
            return { success: true, message: "Transfer initiated" };
        },
    });
}
