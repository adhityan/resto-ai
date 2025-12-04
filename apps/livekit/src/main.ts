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

import { createToken } from "./utils/token.js";
import { RestaurantStandardAgent } from "./agents/restaurantStandard.js";
import { endCall, getFieldFromContext } from "./utils/call.js";
import { getRestaurantKeyByPhone } from "./utils/restaurant.js";

if (process.argv.includes("dev")) {
    const token = await createToken("test-room", "user_123");
    console.log("Token: ", token);
}

export default defineAgent({
    prewarm: async (proc: JobProcess) => {
        proc.userData.vad = await silero.VAD.load();
    },
    entry: async (ctx: JobContext) => {
        console.log(
            "Job received for room name: ",
            ctx.job?.room?.name,
            "with metadata: ",
            ctx.job?.metadata
        );

        const calledPhoneNumber = getFieldFromContext(ctx, "calledPhoneNumber");
        const restaurantApiKey = getRestaurantKeyByPhone(calledPhoneNumber);
        if (!restaurantApiKey) {
            console.error(
                `Restaurant API key not found for phone number: ${calledPhoneNumber}`
            );
            await endCall(ctx);
            return;
        }

        const callerPhoneNumber = getFieldFromContext(ctx, "callerPhoneNumber");
        if (!callerPhoneNumber) {
            console.error(`Caller phone number not found in job metadata`);
            await endCall(ctx);
            return;
        }

        console.log(`Starting session for caller: ${callerPhoneNumber}...`);
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
                restaurantApiKey,
                callerPhoneNumber,
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
