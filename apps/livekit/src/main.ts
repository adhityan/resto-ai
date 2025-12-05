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
import { AxiosInstance } from "axios";
import "dotenv/config";

import { CallModel, CustomerModel } from "@repo/contracts";
import { Speaker, CallTranscript } from "@repo/database";

import { createApiClient, getErrorMessage } from "./utils/http.js";
import { RestaurantStandardAgent } from "./agents/restaurantStandard.js";
import { endCall, getFieldFromContext } from "./utils/call.js";
import { getRestaurantByPhone } from "./utils/restaurant.js";

console.log("LIVEKIT_URL: ", process.env.LIVEKIT_URL);
// if (process.argv.includes("dev")) {
//     const token = await createToken("test-room", "user_123");
//     console.log("Token: ", token);
// }

function createUsageCollector(ctx: JobContext, session: voice.AgentSession) {
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
}

async function getCustomerByPhoneNumber(
    client: AxiosInstance,
    phoneNumber: string
) {
    const { data } = await client.post<CustomerModel>(`/customers`, {
        phone: phoneNumber,
        isOnCall: true,
    });
    return data;
}

async function createCallInDatabase(
    client: AxiosInstance,
    restaurantId: string,
    customerId: string
) {
    const { data } = await client.post<CallModel>(`/calls`, {
        customerId,
        languages: "en",
        restaurantId: restaurantId,
    });
    return data;
}

function setupSessionListeners(
    session: voice.AgentSession,
    client: AxiosInstance,
    callId: string
) {
    // Transcript listener - handles multiple events per session
    const transcriptListener = async (ev: {
        item: { textContent?: string; role: string; interrupted?: boolean };
    }) => {
        try {
            const contents = ev.item.textContent;
            if (!contents) return;

            const speaker =
                ev.item.role === "user" ? Speaker.USER : Speaker.AGENT;
            const wasInterupted = ev.item.interrupted;

            await client.post<CallTranscript>(`/calls/${callId}/transcript`, {
                speaker,
                contents,
                wasInterupted,
            });
        } catch (error) {
            console.error(
                `Failed to save transcript: ${getErrorMessage(error)}`
            );
        }
    };
    session.on(
        voice.AgentSessionEventTypes.ConversationItemAdded,
        transcriptListener
    );

    // Cleanup on close - fires once, removes transcript listener
    session.once(voice.AgentSessionEventTypes.Close, async () => {
        session.off(
            voice.AgentSessionEventTypes.ConversationItemAdded,
            transcriptListener
        );

        try {
            await client.post<CallModel>(`/calls/${callId}/end`, {
                languages: ["en"],
            });
        } catch (error) {
            console.error(`Failed to end call: ${getErrorMessage(error)}`);
        }
    });
}

function createSession(ctx: JobContext) {
    return new voice.AgentSession({
        stt: new deepgram.STT({
            detectLanguage: true,
            smartFormat: true,
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
            preemptiveGeneration: false,
            minInterruptionWords: 1,
            userAwayTimeout: 30,
        },
    });
}

export default defineAgent({
    prewarm: async (proc: JobProcess) => {
        proc.userData.vad = await silero.VAD.load();
    },
    entry: async (ctx: JobContext) => {
        console.log(
            "Job received for room name: ",
            ctx.job?.room?.name,
            "and with metadata: ",
            ctx.job?.metadata
        );

        const calledPhoneNumber = getFieldFromContext(ctx, "calledPhoneNumber");
        const restaurantDetails = getRestaurantByPhone(calledPhoneNumber);
        if (!restaurantDetails) {
            console.error(
                `Restaurant details not found for incoming number: ${calledPhoneNumber}`
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

        const client = createApiClient(restaurantDetails.apiKey);
        const customer = await getCustomerByPhoneNumber(
            client,
            callerPhoneNumber
        );
        console.log(`Customer ID: ${customer.id}`);

        const call = await createCallInDatabase(
            client,
            restaurantDetails.restaurantId,
            customer.id
        );
        console.log(`Call created: ${call.id}`);

        console.log(`Starting session for: ${customer.name ?? customer.phone}`);
        const session = createSession(ctx);

        createUsageCollector(ctx, session);
        setupSessionListeners(session, client, call.id);

        // Connect to room FIRST
        await ctx.connect();

        // THEN start the session with the connected room
        await session.start({
            agent: new RestaurantStandardAgent({
                client,
                customer,
                roomName: ctx.job?.room?.name!,
                managerPhone: restaurantDetails.restaurantManagerPhone,
            }),
            room: ctx.room,
            outputOptions: {
                transcriptionEnabled: true,
            },
            inputOptions: {
                noiseCancellation: BackgroundVoiceCancellation(),
                closeOnDisconnect: true,
                videoEnabled: false,
                textEnabled: false,
            },
        });
    },
});

cli.runApp(
    new ServerOptions({
        agent: fileURLToPath(import.meta.url),
        agentName: "resto-ai",
    })
);
