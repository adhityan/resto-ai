import { RoomServiceClient } from "livekit-server-sdk";
import { getJobContext, JobContext } from "@livekit/agents";

export async function endCall(context?: JobContext) {
    const jobContext = context ?? getJobContext();
    if (!jobContext) {
        console.error("Job context not found!");
        return;
    }

    const roomServiceClient = new RoomServiceClient(
        process.env.LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const roomName = jobContext.room.name ?? context?.job.room?.name;
    if (roomName) {
        console.log(`Hanging up call for room: ${roomName}...`);
        await roomServiceClient.deleteRoom(roomName);
    } else {
        console.warn("Room name not found in job context. Cannot end call!");
    }
}
