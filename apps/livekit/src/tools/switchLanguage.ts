import { llm } from "@livekit/agents";
import * as elevenlabs from "@livekit/agents-plugin-elevenlabs";
import { z } from "zod";

/**
 * Language options with voice IDs (ElevenLabs) and greetings.
 * Add more languages as needed.
 */
const LANGUAGE_OPTIONS: Record<
    string,
    { code: string; voiceId: string; voiceName: string; greeting: string }
> = {
    english: {
        code: "en",
        voiceId: "zGjIP4SZlMnY9m93k97r",
        voiceName: "Hope",
        greeting: "Hello, how can I help you today?",
    },
    dutch: {
        code: "nl",
        voiceId: "zGjIP4SZlMnY9m93k97r",
        voiceName: "Hope",
        greeting: "Hallo, hoe kan ik u vandaag helpen?",
    },
    french: {
        code: "fr",
        voiceId: "zGjIP4SZlMnY9m93k97r",
        voiceName: "Hope",
        greeting: "Bonjour, comment puis-je vous aider?",
    },
};

/**
 * Creates a tool to switch the agent's speaking language.
 * Updates the TTS voice and speaks a greeting in the new language.
 */
export function createSwitchLanguageTool() {
    const supportedLanguages = Object.keys(LANGUAGE_OPTIONS).join(", ");

    return llm.tool({
        description: `Switch to speaking in a supported language. Use this when the customer speaks in a different language and you need to respond in their language.`,
        parameters: z.object({
            language: z
                .string()
                .describe(
                    `The language code to switch to. Must be one of supported languages: ${supportedLanguages}`
                ),
        }),
        execute: async ({ language }, { ctx }) => {
            const option = LANGUAGE_OPTIONS[language];
            console.log(`Starting a switch to language: ${language}`);

            if (!option) {
                return {
                    success: false,
                    language,
                    message: `Can't switch to an unsupported language: ${language}. Supported languages: ${supportedLanguages}`,
                };
            }

            // Update the session's TTS
            ctx.session.tts = new elevenlabs.TTS({
                modelID: "eleven_flash_v2_5",
                voice: {
                    name: option.voiceName,
                    id: option.voiceId,
                    category: "conversational",
                },
                languageCode: option.code,
            });

            return {
                success: true,
                message: `Switched to ${language}`,
                languageCode: option.code,
                language,
            };
        },
    });
}
