import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Room,
    RoomEvent,
    ConnectionState,
    TranscriptionSegment,
    Participant,
} from "livekit-client";
import {
    RoomContext,
    useVoiceAssistant,
    BarVisualizer,
    RoomAudioRenderer,
    useConnectionState,
} from "@livekit/components-react";
import "@livekit/components-styles";
import {
    IconPhone,
    IconPhoneOff,
    IconMicrophone,
    IconMicrophoneOff,
} from "@tabler/icons-react";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";

import api from "@/api";
import { API } from "@/api/routes";
import { LIVEKIT_URL } from "@/config/constants";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface TranscriptEntry {
    id: string;
    participant: string;
    text: string;
    timestamp: Date;
    isFinal: boolean;
}

interface TestAgentCardProps {
    restaurantId: string;
}

interface TokenResponse {
    token: string;
    roomName: string;
    serverUrl: string;
}

function getConnectionStatusText(
    connectionState: ConnectionState,
    agentState: string
): string {
    if (connectionState === ConnectionState.Connecting) return "Connecting...";
    if (connectionState !== ConnectionState.Connected) return "Disconnected";

    switch (agentState) {
        case "listening":
            return "Listening...";
        case "thinking":
            return "Thinking...";
        case "speaking":
            return "Speaking...";
        default:
            return "Connected";
    }
}

function VoiceAssistantUI() {
    const { state, audioTrack } = useVoiceAssistant();
    const connectionState = useConnectionState();

    return (
        <div className="flex flex-col items-center justify-center py-6">
            <div className="mb-4 text-sm text-muted-foreground">
                {getConnectionStatusText(connectionState, state)}
            </div>
            <div className="h-16 w-full max-w-xs">
                {audioTrack && (
                    <BarVisualizer
                        state={state}
                        trackRef={audioTrack}
                        barCount={5}
                        options={{ minHeight: 8 }}
                    />
                )}
            </div>
            <RoomAudioRenderer />
        </div>
    );
}

function TranscriptPanel({ transcripts }: { transcripts: TranscriptEntry[] }) {
    return (
        <div className="flex h-full flex-col rounded-md border">
            <div className="border-b bg-muted/50 px-3 py-2">
                <h4 className="text-sm font-medium">Transcript</h4>
            </div>
            <ScrollArea className="h-48 flex-1 p-3 md:h-full">
                {transcripts.length === 0 ? (
                    <div className="flex h-full min-h-32 items-center justify-center text-sm text-muted-foreground">
                        Conversation transcripts will appear here...
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transcripts.map((entry) => (
                            <div
                                key={entry.id}
                                className={`text-sm ${
                                    entry.participant === "agent"
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-green-600 dark:text-green-400"
                                } ${!entry.isFinal ? "opacity-60" : ""}`}
                            >
                                <span className="font-medium">
                                    {entry.participant === "agent"
                                        ? "Agent: "
                                        : "You: "}
                                </span>
                                <span>{entry.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

function CallContent({
    room,
    onDisconnect,
    transcripts,
}: {
    room: Room;
    onDisconnect: () => void;
    transcripts: TranscriptEntry[];
}) {
    const connectionState = useConnectionState();
    const [isMuted, setIsMuted] = useState(false);
    const {
        isNoiseFilterEnabled,
        isNoiseFilterPending,
        setNoiseFilterEnabled,
    } = useKrispNoiseFilter();
    const krispInitialized = useRef(false);

    // Automatically enable Krisp noise filter on mount
    useEffect(() => {
        if (
            !krispInitialized.current &&
            !isNoiseFilterEnabled &&
            !isNoiseFilterPending
        ) {
            krispInitialized.current = true;
            setNoiseFilterEnabled(true);
        }
    }, [isNoiseFilterEnabled, isNoiseFilterPending, setNoiseFilterEnabled]);

    const toggleMute = useCallback(() => {
        const localParticipant = room.localParticipant;
        localParticipant.setMicrophoneEnabled(isMuted);
        setIsMuted(!isMuted);
    }, [room, isMuted]);

    return (
        <div className="grid h-full gap-4 md:grid-cols-2">
            {/* Left side: Voice UI and controls */}
            <div className="flex flex-col items-center justify-center">
                <VoiceAssistantUI />
                <div className="flex items-center justify-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleMute}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <IconMicrophoneOff size={18} />
                        ) : (
                            <IconMicrophone size={18} />
                        )}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onDisconnect}
                        disabled={
                            connectionState === ConnectionState.Disconnected
                        }
                    >
                        <IconPhoneOff size={18} className="mr-2" />
                        End Call
                    </Button>
                </div>
            </div>
            {/* Right side: Transcript panel */}
            <TranscriptPanel transcripts={transcripts} />
        </div>
    );
}

export function TestAgentCard({ restaurantId }: TestAgentCardProps) {
    const [room] = useState(
        () =>
            new Room({
                audioCaptureDefaults: {
                    autoGainControl: true,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            })
    );
    const [isCallActive, setIsCallActive] = useState(false);
    const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
    const isLocalDisconnect = useRef(false);

    const { mutateAsync: fetchToken, isPending: isTokenPending } = useMutation({
        mutationFn: async (): Promise<TokenResponse> => {
            const response = await api.post(API.LIVEKIT_TOKEN(restaurantId));
            return response.data;
        },
    });

    // Handle transcription events
    useEffect(() => {
        if (!isCallActive) return;

        const handleTranscription = (
            segments: TranscriptionSegment[],
            participant?: Participant
        ) => {
            segments.forEach((segment) => {
                setTranscripts((prev) => {
                    const existingIndex = prev.findIndex(
                        (t) => t.id === segment.id
                    );
                    const entry: TranscriptEntry = {
                        id: segment.id,
                        participant: participant?.isLocal ? "user" : "agent",
                        text: segment.text,
                        timestamp: new Date(),
                        isFinal: segment.final,
                    };

                    if (existingIndex >= 0) {
                        const updated = [...prev];
                        updated[existingIndex] = entry;
                        return updated;
                    }
                    return [...prev, entry];
                });
            });
        };

        room.on(RoomEvent.TranscriptionReceived, handleTranscription);

        return () => {
            room.off(RoomEvent.TranscriptionReceived, handleTranscription);
        };
    }, [room, isCallActive]);

    const startCall = useCallback(async () => {
        try {
            const { token } = await fetchToken();
            setTranscripts([]);
            setIsCallActive(true);

            // Connect and wait for the room to be fully connected
            await room.connect(LIVEKIT_URL, token);

            // Wait for the engine to be ready before publishing
            await new Promise<void>((resolve) => {
                if (room.state === ConnectionState.Connected) {
                    resolve();
                } else {
                    room.once(RoomEvent.Connected, () => resolve());
                }
            });

            // Now it's safe to enable the microphone
            await room.localParticipant.setMicrophoneEnabled(true);
        } catch {
            toast.error("Failed to start call. Please try again.");
            setIsCallActive(false);
        }
    }, [room, fetchToken]);

    const endCall = useCallback(async () => {
        isLocalDisconnect.current = true;
        await room.disconnect();
        setIsCallActive(false);
    }, [room]);

    // Handle server-side disconnection
    useEffect(() => {
        const handleDisconnect = () => {
            setIsCallActive(false);
            if (!isLocalDisconnect.current) {
                toast.info("Call ended by server");
            }
            isLocalDisconnect.current = false;
        };

        room.on(RoomEvent.Disconnected, handleDisconnect);

        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnect);
            room.disconnect();
        };
    }, [room]);

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>Test Agent</CardTitle>
                <CardDescription>
                    Test the voice agent for this restaurant
                </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-96 flex-col">
                {isCallActive ? (
                    <RoomContext.Provider value={room}>
                        <div className="flex-1">
                            <CallContent
                                room={room}
                                onDisconnect={endCall}
                                transcripts={transcripts}
                            />
                        </div>
                    </RoomContext.Provider>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center">
                        <p className="mb-4 text-sm text-muted-foreground">
                            Click the button below to start a test call with the
                            AI agent
                        </p>
                        <Button onClick={startCall} disabled={isTokenPending}>
                            <IconPhone size={18} className="mr-2" />
                            {isTokenPending ? "Connecting..." : "Start Call"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
