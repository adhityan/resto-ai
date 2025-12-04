import {
    AccessToken,
    RoomAgentDispatch,
    RoomConfiguration,
} from "livekit-server-sdk";
import "dotenv/config";

export const createToken = async (
    roomName: string,
    participantName: string
) => {
    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: participantName,
        }
    );
    at.addGrant({ roomJoin: true, room: roomName });
    at.roomConfig = new RoomConfiguration({
        agents: [
            new RoomAgentDispatch({
                agentName: "resto-ai",
                metadata: `{"restaurantId": "353816f8-4204-406c-842f-529347706874"}`,
            }),
        ],
    });
    return await at.toJwt();
};
