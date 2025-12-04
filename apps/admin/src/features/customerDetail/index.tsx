import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy, IconCalendar, IconPhone } from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/api";
import { CustomerDetail } from "@/stores/customersStore";
import { ReservationListItem } from "@/stores/reservationsStore";
import { CallListItem } from "@/stores/callsStore";
import { API } from "@/api/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { calculateDurationSeconds, formatDuration } from "@/utils/format";

export default function CustomerDetailPage() {
    const router = useRouter();
    const { customerId } = useParams({ strict: false }) as {
        customerId: string;
    };

    const { data: customer, isLoading: isLoadingCustomer } = useQuery<CustomerDetail>({
        queryKey: ["customer", customerId],
        queryFn: async () => (await api.get(API.CUSTOMER_DETAIL(customerId))).data,
        enabled: !!customerId,
    });

    const { data: reservationsData, isLoading: isLoadingReservations } = useQuery<{
        items: ReservationListItem[];
        total: number;
    }>({
        queryKey: ["customer-reservations", customerId],
        queryFn: async () => (await api.get(API.CUSTOMER_RESERVATIONS(customerId))).data,
        enabled: !!customerId,
    });

    const { data: callsData, isLoading: isLoadingCalls } = useQuery<{
        items: CallListItem[];
        total: number;
    }>({
        queryKey: ["customer-calls", customerId],
        queryFn: async () => (await api.get(API.CUSTOMER_CALLS(customerId))).data,
        enabled: !!customerId,
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const getReservationStatusVariant = (status: string) => {
        switch (status.toUpperCase()) {
            case "CONFIRMED":
                return "default";
            case "WAITING":
            case "WAITING_CUSTOMER":
                return "secondary";
            case "CANCELED":
            case "REFUSED":
            case "NO_SHOWN":
                return "destructive";
            case "ARRIVED":
            case "SEATED":
                return "outline";
            case "OVER":
                return "default";
            default:
                return "outline";
        }
    };

    const formatReservationStatus = (status: string) => {
        const statusMap: Record<string, string> = {
            WAITING: "Waiting",
            WAITING_CUSTOMER: "Waiting for Customer",
            CONFIRMED: "Confirmed",
            CANCELED: "Canceled",
            REFUSED: "Refused",
            ARRIVED: "Arrived",
            SEATED: "Seated",
            OVER: "Completed",
            NO_SHOWN: "No Show",
        };
        return statusMap[status.toUpperCase()] || status;
    };

    const getCallStatusVariant = (status: string) => {
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

    if (isLoadingCustomer) {
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
                    <div className="text-muted-foreground mb-3 text-sm">Customers</div>
                    <div className="flex h-64 items-center justify-center">
                        <p className="text-muted-foreground">Loading customer details...</p>
                    </div>
                </Main>
            </>
        );
    }

    if (!customer) return null;

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
                <div className="text-muted-foreground mb-3 text-sm">Customers &gt; {customer.name || customer.phone}</div>

                {/* Page Heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{customer.name || customer.phone}</h2>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {customer.id}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(customer.id, "Customer ID")}>
                            <IconCopy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6">
                    {/* Customer Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                            <CardDescription>Basic customer details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Phone</p>
                                <p className="text-lg font-semibold">{customer.phone}</p>
                            </div>
                            {customer.name && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Name</p>
                                    <p className="text-sm">{customer.name}</p>
                                </div>
                            )}
                            {customer.email && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Email</p>
                                    <p className="text-sm">{customer.email}</p>
                                </div>
                            )}
                            {customer.address && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Address</p>
                                    <p className="text-sm">{customer.address}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Number of Calls</p>
                                <p className="text-sm font-semibold">{customer.numberOfCalls}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Created At</p>
                                    <p className="text-sm">{format(new Date(customer.createdAt), "PPpp")}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Updated At</p>
                                    <p className="text-sm">{format(new Date(customer.updatedAt), "PPpp")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reservations Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <IconCalendar className="h-5 w-5" />
                                <div>
                                    <CardTitle>Reservations</CardTitle>
                                    <CardDescription>
                                        {reservationsData?.total ?? 0} reservation(s) made by this customer
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingReservations ? (
                                <p className="text-muted-foreground text-sm">Loading reservations...</p>
                            ) : reservationsData?.items.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No reservations found for this customer.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Booking ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Party Size</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reservationsData?.items.map((reservation) => (
                                            <TableRow key={reservation.id}>
                                                <TableCell>
                                                    <Link
                                                        to="/reservations/$reservationId"
                                                        params={{ reservationId: reservation.id }}
                                                        className="text-primary hover:underline font-mono text-sm"
                                                    >
                                                        {reservation.zenchefBookingId}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{reservation.date}</TableCell>
                                                <TableCell>{reservation.time}</TableCell>
                                                <TableCell>{reservation.numberOfGuests} guests</TableCell>
                                                <TableCell>
                                                    <Badge variant={getReservationStatusVariant(reservation.status)}>
                                                        {formatReservationStatus(reservation.status)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Calls Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <IconPhone className="h-5 w-5" />
                                <div>
                                    <CardTitle>Calls</CardTitle>
                                    <CardDescription>
                                        {callsData?.total ?? 0} call(s) made by this customer
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCalls ? (
                                <p className="text-muted-foreground text-sm">Loading calls...</p>
                            ) : callsData?.items.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No calls found for this customer.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Call ID</TableHead>
                                            <TableHead>Start Time</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead>Language</TableHead>
                                            <TableHead>Escalated</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {callsData?.items.map((call) => (
                                            <TableRow key={call.id}>
                                                <TableCell>
                                                    <Link
                                                        to="/calls/$callId"
                                                        params={{ callId: call.id }}
                                                        className="text-primary hover:underline font-mono text-sm"
                                                    >
                                                        {call.id.slice(0, 8)}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{format(new Date(call.startTime), "PPpp")}</TableCell>
                                                <TableCell>
                                                    {formatDuration(calculateDurationSeconds(call.startTime, call.endTime))}
                                                </TableCell>
                                                <TableCell>{call.language || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant={call.escalationRequested ? "destructive" : "outline"}>
                                                        {call.escalationRequested ? "Yes" : "No"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getCallStatusVariant(call.status)}>
                                                        {call.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
