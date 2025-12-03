import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { OperationsOverview } from "./components/operations-overview";
import { LanguageBreakdown } from "./components/language-breakdown";
import { CallDurationTrendChart } from "./components/call-duration-trend";
import type { DashboardResponseModel } from "@repo/contracts";
import { API } from "@/api/routes";
import { IconCalendarEvent, IconPhone, IconClock, IconAlertTriangle } from "@tabler/icons-react";

export default function Dashboard() {
    const { data: stats } = useQuery<DashboardResponseModel>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => (await api.get(API.DASHBOARD)).data,
    });

    const formatDuration = (minutes: number | undefined) => {
        if (minutes === undefined) return "-";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    return (
        <>
            {/* ===== Top Heading ===== */}
            <Header>
                <Search />
                <div className="ml-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>

            {/* ===== Main ===== */}
            <Main>
                <div className="mb-4 flex items-center justify-between space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                </div>
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
                                <IconCalendarEvent className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.totalReservations.current.toLocaleString() ?? "-"}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.totalReservations.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                                <IconPhone className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.totalCalls.current.toLocaleString() ?? "-"}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.totalCalls.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Call Duration</CardTitle>
                                <IconClock className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatDuration(stats?.totalCallDuration.current)}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.totalCallDuration.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Manager Escalations</CardTitle>
                                <IconAlertTriangle className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.managerEscalations.current.toLocaleString() ?? "-"}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.managerEscalations.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                        <Card className="col-span-1 lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Restaurant Operations</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <OperationsOverview />
                            </CardContent>
                        </Card>
                        <Card className="col-span-1 lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Call Duration Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CallDurationTrendChart />
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Language Spoken</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <LanguageBreakdown />
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
