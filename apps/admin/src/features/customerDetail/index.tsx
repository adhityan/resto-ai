import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy } from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/api";
import { CustomerDetail } from "@/stores/customersStore";
import { API } from "@/api/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";

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

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
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
                </div>
            </Main>
        </>
    );
}
