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
                metadata: JSON.stringify({
                    calledPhoneNumber: "+31612345678",
                    callerPhoneNumber: "+31612345678",
                }),
            }),
        ],
    });
    return await at.toJwt();
};
