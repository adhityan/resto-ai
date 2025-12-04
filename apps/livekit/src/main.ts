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

import { RestaurantStandardAgent } from "./agents/restaurantStandard.js";
import { createToken } from "./utils/token.js";
import { getFieldFromContext, getRequiredMetadataField } from "./utils/call.js";

const token = await createToken("test-room", "user_123");
console.log("Token: ", token);

export default defineAgent({
    prewarm: async (proc: JobProcess) => {
        proc.userData.vad = await silero.VAD.load();
    },
    entry: async (ctx: JobContext) => {
        console.log("Room name: ", ctx.job?.room?.name);

        console.log("Metadata: ", ctx.job?.metadata);
        const restaurantApiKey = await getRequiredMetadataField(
            ctx,
            "restaurantApiKey"
        );
        if (!restaurantApiKey) return;

        const restaurantId = getFieldFromContext(ctx, "restaurantId");
        console.log(`Starting session for restaurant: ${restaurantId}...`);

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

            turnDetection: new livekit.turnDetector.MultilingualModel(),
            vad: ctx.proc.userData.vad! as silero.VAD,
            voiceOptions: {
                minInterruptionWords: 1,
                preemptiveGeneration: true,
            },
        });

        // Metrics collection
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

        // Start the session with the restaurant standard agent
        await session.start({
            agent: new RestaurantStandardAgent({
                metadata: ctx.job.metadata,
                apiKey: restaurantApiKey,
            }),
            room: ctx.room,
            outputOptions: {
                transcriptionEnabled: true,
            },
            inputOptions: {
                noiseCancellation: BackgroundVoiceCancellation(),
                closeOnDisconnect: true,
            },
        });

        // Agent handles greeting in onEnter method
        await ctx.connect();
    },
});

cli.runApp(
    new ServerOptions({
        agent: fileURLToPath(import.meta.url),
        agentName: "resto-ai",
    })
);
