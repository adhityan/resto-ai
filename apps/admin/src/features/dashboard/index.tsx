import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { RevenueOverview } from "./components/revenue-overview";
import { RevenueAppBreakdown } from "./components/revenue-app-breakdown";
import { CustomerTrendChart } from "./components/customer-trend-chart";
import type { DashboardResponseModel } from "@repo/contracts";
import { API } from "@/api/routes";

export default function Dashboard() {
    const { data: stats } = useQuery<DashboardResponseModel>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => (await api.get(API.DASHBOARD)).data,
    });

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
                                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="text-muted-foreground h-4 w-4"
                                >
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats?.totalEarnings.current.toLocaleString() ?? "-"}</div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.totalEarnings.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Number of Purchases</CardTitle>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="text-muted-foreground h-4 w-4"
                                >
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.numberOfPurchases.current.toLocaleString() ?? "-"}</div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.numberOfPurchases.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Number of New Subscriptions</CardTitle>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="text-muted-foreground h-4 w-4"
                                >
                                    <path d="M17 2.1l4 4-4 4" />
                                    <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8M7 21.9l-4-4 4-4" />
                                    <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.numberOfNewSubscriptions.current.toLocaleString() ?? "-"}</div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.numberOfNewSubscriptions.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">New Customers</CardTitle>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    className="text-muted-foreground h-4 w-4"
                                >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.newCustomers.current.toLocaleString() ?? "-"}</div>
                                <p className="text-muted-foreground text-xs">
                                    {stats ? `${stats.newCustomers.changePct}% from last month` : "-"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
                        <Card className="col-span-1 lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Revenue</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <RevenueOverview />
                            </CardContent>
                        </Card>
                        <Card className="col-span-1 lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Customer Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomerTrendChart />
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue App Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <RevenueAppBreakdown />
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
