import { getJobContext, JobContext } from "@livekit/agents";
import { getRoomServiceClient } from "./roomService.js";
import { CallModel } from "@repo/contracts";
import { getErrorMessage } from "./http.js";
import { AxiosInstance } from "axios";

/**
 * Parses a JSON metadata string into a Record.
 * Returns empty object if parsing fails or result is not an object.
 */
export function parseMetadata(metadata: string): Record<string, unknown> {
    try {
        const value = JSON.parse(metadata);
        if (typeof value === "object" && value !== null) {
            return value as Record<string, unknown>;
        }
        return {};
    } catch {
        return {};
    }
}

/**
 * Extracts a field from job metadata JSON string.
 * Returns null if metadata is invalid or field doesn't exist.
 */
export function getFieldFromContext(
    ctx: JobContext,
    field: string
): string | null {
    const metadataString = ctx.job.metadata;
    try {
        const metadata = JSON.parse(metadataString);
        return metadata[field] ?? null;
    } catch {
        return null;
    }
}

export function endCall(contextOrName?: JobContext | string);
export function endCall(
    contextOrName: JobContext | string,
    client: AxiosInstance,
    callId: string
);
export async function endCall(
    contextOrName?: JobContext | string,
    client?: AxiosInstance,
    callId?: string
) {
    let context: JobContext | undefined = undefined;
    let roomNameFromInput: string | undefined = undefined;
    if (typeof contextOrName === "string") roomNameFromInput = contextOrName;
    else context = contextOrName;

    const jobContext = context ?? getJobContext();
    if (!jobContext) {
        console.error("Job context not found!");
        return;
    }

    const roomServiceClient = getRoomServiceClient();
    const roomName =
        roomNameFromInput ?? jobContext.room.name ?? context?.job.room?.name;
    if (roomName) {
        console.log(`Hanging up call for room: ${roomName}...`);
        await roomServiceClient.deleteRoom(roomName);
    } else {
        console.warn("Room name not found in job context. Cannot end call!");
    }

    if (client && callId) {
        await recordCallEnd(client, callId);
    }
}

async function recordCallEnd(client: AxiosInstance, callId: string) {
    try {
        await client.post<CallModel>(`/calls/${callId}/end`, {
            languages: ["en"],
        });
    } catch (error) {
        console.error(`Failed to end call: ${getErrorMessage(error)}`);
    }
}
