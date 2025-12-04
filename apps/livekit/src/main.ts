import {
    type JobContext,
    type JobProcess,
    ServerOptions,
    cli,
    defineAgent,
    metrics,
    voice,
} from "@livekit/agents";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";
import * as deepgram from "@livekit/agents-plugin-deepgram";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as gemini from "@livekit/agents-plugin-google";
import * as silero from "@livekit/agents-plugin-silero";
import { fileURLToPath } from "node:url";
import "dotenv/config";

import { Assistant } from "./agents/sample.js";
import { createToken } from "./utils/token.js";
import { endCall } from "./utils/call.js";

const token = await createToken("test-room", "user_123");
console.log("Token: ", token);

function getRestaurantId(metadataString: string) {
    try {
        // console.log(`Parsing metadata: ${metadataString}`);
        const metadata = JSON.parse(metadataString);
        return metadata.restaurantId ?? null;
    } catch {
        return null;
    }
}

export default defineAgent({
    prewarm: async (proc: JobProcess) => {
        proc.userData.vad = await silero.VAD.load();
    },
    entry: async (ctx: JobContext) => {
        console.log("Room name: ", ctx.job?.room?.name);
        const restaurantId = getRestaurantId(ctx.job.metadata);

        if (!restaurantId) {
            console.error("Restaurant ID is required in job metadata!");
            endCall(ctx);
            return;
        }

        console.log(`Starting session for restaurant: ${restaurantId}...`);
        // Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
        const session = new voice.AgentSession({
            stt: new deepgram.STT({
                detectLanguage: true,
                model: "nova-3",
            }),

            tts: new elevenlabs.TTS({
                modelID: "eleven_flash_v2_5",
                voice: {
                    name: "Hope",
                    id: "zGjIP4SZlMnY9m93k97r",
                    category: "conversational",
                },
            }),

            llm: new gemini.LLM({
                vertexai: true,
                model: "gemini-2.5-flash",
            }),

            // VAD and turn detection are used to determine when the user is speaking and when the agent should respond
            // See more at https://docs.livekit.io/agents/build/turns
            turnDetection: new livekit.turnDetector.MultilingualModel(),
            vad: ctx.proc.userData.vad! as silero.VAD,
            voiceOptions: {
                minInterruptionWords: 1,
                // Allow the LLM to generate a response while waiting for the end of turn
                preemptiveGeneration: true,
            },
        });

        // Metrics collection, to measure pipeline performance
        // For more information, see https://docs.livekit.io/agents/build/metrics/
        const usageCollector = new metrics.UsageCollector();
        session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
            metrics.logMetrics(ev.metrics);
            usageCollector.collect(ev.metrics);
        });

        const logUsage = async () => {
            const summary = usageCollector.getSummary();
            console.log(`Usage: ${JSON.stringify(summary)}`);
        };
        ctx.addShutdownCallback(logUsage);

        // Start the session, which initializes the voice pipeline and warms up the models
        await session.start({
            agent: new Assistant(),
            room: ctx.room,
            outputOptions: {
                transcriptionEnabled: true,
            },
            inputOptions: {
                noiseCancellation: BackgroundVoiceCancellation(),
                closeOnDisconnect: true,
            },
        });

        session.generateReply({
            instructions: "greet the user and ask about their day",
        });

        // Join the room and connect to the user
        await ctx.connect();
    },
});

cli.runApp(
    new ServerOptions({
        agent: fileURLToPath(import.meta.url),
        agentName: "resto-ai",
    })
);
