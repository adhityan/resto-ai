import { RoomServiceClient } from "livekit-server-sdk";

let instance: RoomServiceClient | null = null;

/**
 * Returns a singleton RoomServiceClient instance.
 * Creates the instance lazily on first call.
 */
export function getRoomServiceClient(): RoomServiceClient {
    instance ??= new RoomServiceClient(
        process.env.LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );
    return instance;
}
