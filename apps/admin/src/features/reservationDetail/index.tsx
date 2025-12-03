import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy } from "@tabler/icons-react";
import { toast } from "sonner";
import api from "@/api";
import { API } from "@/api/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import type { AdminReservationModel, RestaurantModel } from "@repo/contracts";

const getStatusVariant = (status: string) => {
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

const formatStatus = (status: string) => {
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

export default function ReservationDetailPage() {
    const router = useRouter();
    const { reservationId } = useParams({ strict: false }) as {
        reservationId: string;
    };

    const { data: reservation, isLoading } = useQuery<AdminReservationModel>({
        queryKey: ["reservation", reservationId],
        queryFn: async () => (await api.get(API.RESERVATION_DETAIL(reservationId))).data,
        enabled: !!reservationId,
    });

    const { data: restaurant } = useQuery<RestaurantModel>({
        queryKey: ["restaurant", reservation?.restaurantId],
        queryFn: async () => (await api.get(API.RESTAURANT_DETAIL(reservation!.restaurantId))).data,
        enabled: !!reservation?.restaurantId,
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
                    <div className="text-muted-foreground mb-3 text-sm">Reservations</div>
                    <div className="flex h-64 items-center justify-center">
                        <p className="text-muted-foreground">Loading reservation details...</p>
                    </div>
                </Main>
            </>
        );
    }

    if (!reservation) return null;

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
                <div className="text-muted-foreground mb-3 text-sm">
                    Reservations &gt; {reservation.zenchefBookingId}
                </div>

                {/* Page Heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Reservation Detail</h2>
                        <Badge variant={getStatusVariant(reservation.status)}>
                            {formatStatus(reservation.status)}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {reservation.zenchefBookingId}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(reservation.zenchefBookingId, "Booking ID")}
                        >
                            <IconCopy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="space-y-6">
                    {/* Reservation Information Card - Full Width */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reservation Information</CardTitle>
                            <CardDescription>Core reservation details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Date</p>
                                    <p className="text-lg font-semibold">{reservation.date}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Time</p>
                                    <p className="text-lg font-semibold">{reservation.time}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Party Size</p>
                                    <p className="text-lg font-semibold">{reservation.numberOfGuests} guests</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Status</p>
                                    <p className="text-lg font-semibold">{formatStatus(reservation.status)}</p>
                                </div>
                            </div>
                            {reservation.seatingAreaName && (
                                <div className="mt-4">
                                    <p className="text-muted-foreground text-sm font-medium">Seating Area</p>
                                    <p className="text-sm mt-1">{reservation.seatingAreaName}</p>
                                </div>
                            )}
                            {reservation.comments && (
                                <div className="mt-4">
                                    <p className="text-muted-foreground text-sm font-medium">Special Requests</p>
                                    <p className="text-sm mt-1">{reservation.comments}</p>
                                </div>
                            )}
                            {reservation.allergies && (
                                <div className="mt-4">
                                    <p className="text-muted-foreground text-sm font-medium">Allergies</p>
                                    <p className="text-sm mt-1">{reservation.allergies}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customer and Restaurant Cards - Half Width */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Customer Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer</CardTitle>
                                <CardDescription>Customer information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Name</p>
                                    <p className="text-sm">{reservation.customerName}</p>
                                </div>
                                {reservation.customerPhone && (
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Phone</p>
                                        <p className="text-sm">{reservation.customerPhone}</p>
                                    </div>
                                )}
                                {reservation.customerEmail && (
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Email</p>
                                        <p className="text-sm">{reservation.customerEmail}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Restaurant Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Restaurant</CardTitle>
                                <CardDescription>Restaurant information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Name</p>
                                    <p className="text-sm">
                                        {reservation.restaurantName || restaurant?.name || "Loading..."}
                                    </p>
                                </div>
                                {restaurant?.restaurantPhoneNumber && (
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Phone Number</p>
                                        <p className="text-sm">{restaurant.restaurantPhoneNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Restaurant ID</p>
                                    <p className="font-mono text-sm">{reservation.restaurantId}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </Main>
        </>
    );
}

