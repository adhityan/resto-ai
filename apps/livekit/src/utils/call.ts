import { getJobContext, JobContext } from "@livekit/agents";
import { getRoomServiceClient } from "./roomService.js";

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

export async function endCall(context?: JobContext) {
    const jobContext = context ?? getJobContext();
    if (!jobContext) {
        console.error("Job context not found!");
        return;
    }

    const roomServiceClient = getRoomServiceClient();
    const roomName = jobContext.room.name ?? context?.job.room?.name;
    if (roomName) {
        console.log(`Hanging up call for room: ${roomName}...`);
        await roomServiceClient.deleteRoom(roomName);
    } else {
        console.warn("Room name not found in job context. Cannot end call!");
    }
}
