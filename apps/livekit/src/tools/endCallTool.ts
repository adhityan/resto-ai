import { llm } from "@livekit/agents";
import { endCall } from "../utils/call.js";

export function endCallTool(roomName: string) {
    return llm.tool({
        description: `Call this tool to end the call. Do not call this tool if the call is not over. Invoke this tool only after you have said your goodbye to the user.`,
        execute: async () => {
            endCall(roomName);
        },
    });
}
