import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy, IconUser, IconRobot, IconPhoneOutgoing } from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/api";
import { CallDetail } from "@/stores/callsStore";
import { API } from "@/api/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { calculateDurationSeconds, formatDuration } from "@/utils/format";

interface TranscriptItem {
    id: string;
    speaker: "USER" | "AGENT" | "SYSTEM";
    contents: string;
    wasInterupted: boolean;
    time: string;
}

interface SystemToolCall {
    type: string;
    toolName: string;
    message: string;
}

function parseSystemContents(contents: string): SystemToolCall | null {
    try {
        const parsed = JSON.parse(contents);
        if (parsed.type === "ToolCall" && parsed.message) {
            return parsed as SystemToolCall;
        }
        return null;
    } catch {
        return null;
    }
}

interface TranscriptListResponse {
    items: TranscriptItem[];
    total: number;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return "default";
        case "ACTIVE":
            return "secondary";
        case "FAILED":
            return "destructive";
        default:
            return "outline";
    }
};

export default function CallDetailPage() {
    const router = useRouter();
    const { callId } = useParams({ strict: false }) as {
        callId: string;
    };

    const { data: call, isLoading } = useQuery<CallDetail>({
        queryKey: ["call", callId],
        queryFn: async () => (await api.get(API.CALL_DETAIL(callId))).data,
        enabled: !!callId,
    });

    const { data: transcripts, isLoading: isLoadingTranscripts } = useQuery<TranscriptListResponse>({
        queryKey: ["call-transcripts", callId],
        queryFn: async () => (await api.get(API.CALL_TRANSCRIPTS(callId))).data,
        enabled: !!callId,
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    if (isLoading) {
        return (
            <>
                <Header fixed>
                    <Button variant="outline" size="icon" onClick={() => router.history.back()}>
                        <IconArrowLeft />
                    </Button>
                    <Search />
                    <div className="ml-auto flex items-center space-x-4">
                        <ThemeSwitch />
                        <ProfileDropdown />
                    </div>
                </Header>
                <Main fixed>
                    <div className="text-muted-foreground mb-3 text-sm">Calls</div>
                    <div className="flex h-64 items-center justify-center">
                        <p className="text-muted-foreground">Loading call details...</p>
                    </div>
                </Main>
            </>
        );
    }

    if (!call) return null;

    return (
        <>
            <Header fixed>
                <Button variant="outline" size="icon" onClick={() => router.history.back()}>
                    <IconArrowLeft />
                </Button>
                <Search />
                <div className="ml-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main fixed>
                {/* Breadcrumb */}
                <div className="text-muted-foreground mb-3 text-sm">Calls &gt; {call.id}</div>

                {/* Page Heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Call Detail</h2>
                        <Badge variant={getStatusVariant(call.status)}>{call.status}</Badge>
                        {call.escalationRequested && <Badge variant="destructive">Escalated</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {call.id}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(call.id, "Call ID")}>
                            <IconCopy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Call Information Card - Full Width */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Call Information</CardTitle>
                        <CardDescription>Core call details and status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            {call.endTime && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Duration</p>
                                    <p className="text-2xl font-bold">
                                        {formatDuration(calculateDurationSeconds(call.startTime, call.endTime))}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Language</p>
                                <p className="text-sm">{call.language || "Unknown"}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Start Time</p>
                                <p className="text-sm">{format(new Date(call.startTime), "PPpp")}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">End Time</p>
                                <p className="text-sm">{call.endTime ? format(new Date(call.endTime), "PPpp") : "-"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer and Restaurant Cards - 50% each */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 mb-6">
                    {/* Customer Card */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                            <CardDescription>Customer information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {call.customer ? (
                                <>
                                    {call.customer.name && (
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Name</p>
                                            <p className="text-sm">{call.customer.name}</p>
                                        </div>
                                    )}
                                    {call.customer.email && (
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Email</p>
                                            <p className="text-sm">{call.customer.email}</p>
                                        </div>
                                    )}
                                    {call.customer.phone && (
                                        <div>
                                            <p className="text-muted-foreground text-sm font-medium">Phone</p>
                                            <p className="text-sm">{call.customer.phone}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Customer ID</p>
                                        <Link
                                            to="/customers/$customerId"
                                            params={{ customerId: call.customer.id }}
                                            className="text-primary hover:underline font-mono text-sm"
                                        >
                                            {call.customer.id}
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-sm">No customer information available.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Restaurant Card */}
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Restaurant</CardTitle>
                            <CardDescription>Restaurant information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {call.restaurant ? (
                                <>
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Name</p>
                                        <p className="text-sm">{call.restaurant.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Phone Number</p>
                                        <p className="text-sm">{call.restaurant.incomingPhoneNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Restaurant ID</p>
                                        <Link
                                            to="/settings/restaurants/$restaurantId"
                                            params={{ restaurantId: call.restaurant.id }}
                                            className="text-primary hover:underline font-mono text-sm"
                                        >
                                            {call.restaurant.id}
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <p className="text-muted-foreground text-sm">No restaurant information available.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Reservation Card - only if reservation exists */}
                {call.zenchefReservationId && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Reservation</CardTitle>
                            <CardDescription>Linked reservation details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Zenchef Reservation ID</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm">{call.zenchefReservationId}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(call.zenchefReservationId!, "Reservation ID")}
                                    >
                                        <IconCopy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Transcripts Card - Full Width */}
                <Card>
                    <CardHeader>
                        <CardTitle>Call Transcripts</CardTitle>
                        <CardDescription>Conversation history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingTranscripts ? (
                            <p className="text-muted-foreground text-sm">Loading transcripts...</p>
                        ) : transcripts && transcripts.items.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {transcripts.items.map((transcript) => {
                                    // Handle SYSTEM speaker (tool calls)
                                    if (transcript.speaker === "SYSTEM") {
                                        const toolCall = parseSystemContents(transcript.contents);
                                        return (
                                            <div
                                                key={transcript.id}
                                                className="flex justify-center"
                                            >
                                                <div className="flex items-center gap-2 rounded-full bg-orange-100 dark:bg-orange-950 px-4 py-2">
                                                    <IconPhoneOutgoing className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                                        {toolCall?.message || transcript.contents}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {format(new Date(transcript.time), "HH:mm:ss")}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Handle USER and AGENT speakers
                                    return (
                                        <div
                                            key={transcript.id}
                                            className={`flex gap-3 ${transcript.speaker === "USER" ? "flex-row" : "flex-row-reverse"}`}
                                        >
                                            <div
                                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                    transcript.speaker === "USER"
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted"
                                                }`}
                                            >
                                                {transcript.speaker === "USER" ? (
                                                    <IconUser className="h-4 w-4" />
                                                ) : (
                                                    <IconRobot className="h-4 w-4" />
                                                )}
                                            </div>
                                            <div
                                                className={`flex-1 rounded-lg p-3 ${
                                                    transcript.speaker === "USER"
                                                        ? "bg-primary/10 mr-12"
                                                        : "bg-muted ml-12"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-medium">
                                                        {transcript.speaker === "USER" ? "Customer" : "Agent"}
                                                    </span>
                                                    <span className="text-muted-foreground text-xs">
                                                        {format(new Date(transcript.time), "HH:mm:ss")}
                                                    </span>
                                                    {transcript.wasInterupted && (
                                                        <Badge variant="outline" className="text-xs py-0">
                                                            Interrupted
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm">{transcript.contents}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">No transcripts available for this call.</p>
                        )}
                    </CardContent>
                </Card>
            </Main>
        </>
    );
}

