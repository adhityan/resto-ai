import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy } from "@tabler/icons-react";
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

const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return "-";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
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

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Call Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Call Information</CardTitle>
                            <CardDescription>Core call details and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Duration</p>
                                <p className="text-2xl font-bold">{formatDuration(call.duration)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Language</p>
                                <p className="text-sm">{call.language || "Unknown"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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

                    {/* Customer Card */}
                    {call.customer && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer</CardTitle>
                                <CardDescription>Customer information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Name</p>
                                    <p className="text-sm">{call.customer.name}</p>
                                </div>
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
                                    <p className="font-mono text-sm">{call.customer.id}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Restaurant Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurant</CardTitle>
                            <CardDescription>Restaurant information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <p className="font-mono text-sm">{call.restaurant.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reservation Card - only if reservation exists */}
                    {call.zenchefReservationId && (
                        <Card>
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

                    {/* Transcript Card - Full Width */}
                    {call.transcript && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Call Transcript</CardTitle>
                                <CardDescription>Full conversation transcript</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted rounded-md p-4 whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                                    {call.transcript}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </Main>
        </>
    );
}

