import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy } from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/api";
import { PaymentDetail } from "@/stores/paymentsStore";
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
import { formatStatus, formatPaymentType } from "@/utils/format";

const getStatusVariant = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return "default";
        case "PENDING":
            return "secondary";
        case "DUE":
            return "destructive";
        default:
            return "outline";
    }
};

export default function PaymentDetailPage() {
    const router = useRouter();
    const { paymentId } = useParams({ strict: false }) as {
        paymentId: string;
    };

    const { data: payment, isLoading } = useQuery<PaymentDetail>({
        queryKey: ["payment", paymentId],
        queryFn: async () => (await api.get(API.PAYMENT_DETAIL(paymentId))).data,
        enabled: !!paymentId,
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
                    <div className="text-muted-foreground mb-3 text-sm">Payments</div>
                    <div className="flex h-64 items-center justify-center">
                        <p className="text-muted-foreground">Loading payment details...</p>
                    </div>
                </Main>
            </>
        );
    }

    if (!payment) return null;

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
                <div className="text-muted-foreground mb-3 text-sm">Payments &gt; {payment.id}</div>

                {/* Page Heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Payment Detail</h2>
                        <Badge variant={getStatusVariant(payment.status)}>{formatStatus(payment.status)}</Badge>
                        <Badge variant="outline">{formatPaymentType(payment.type)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {payment.id}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(payment.id, "Payment ID")}>
                            <IconCopy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Payment Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                            <CardDescription>Core payment details and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Amount</p>
                                <p className="text-2xl font-bold">
                                    {payment.amount.toFixed(2)} {payment.currency}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Stripe Payment ID</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm break-all">{payment.stripePaymentId}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(payment.stripePaymentId, "Stripe Payment ID")}
                                    >
                                        <IconCopy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Created At</p>
                                    <p className="text-sm">{format(new Date(payment.createdAt), "PPpp")}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Updated At</p>
                                    <p className="text-sm">{format(new Date(payment.updatedAt), "PPpp")}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session Card */}
                    {payment.session && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Session</CardTitle>
                                <CardDescription>Checkout session details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Status</p>
                                    <Badge variant="outline">{formatStatus(payment.session.status)}</Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Session ID</p>
                                    <p className="font-mono text-sm">{payment.session.id}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Stripe Session ID</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm">{payment.session.stripeSessionId}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => copyToClipboard(payment.session!.stripeSessionId, "Stripe Session ID")}
                                        >
                                            <IconCopy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Application Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Application</CardTitle>
                            <CardDescription>Application that processed this payment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Application Name</p>
                                <p className="text-sm">{payment.application.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Application ID</p>
                                <p className="font-mono text-sm">{payment.application.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer</CardTitle>
                            <CardDescription>Customer information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Email</p>
                                <p className="text-sm">{payment.customer.email}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Customer ID</p>
                                <p className="font-mono text-sm">{payment.customer.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Card - only if subscription exists */}
                    {payment.subscription && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Subscription</CardTitle>
                                <CardDescription>Recurring subscription details</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Status</p>
                                    <Badge variant="outline">{formatStatus(payment.subscription.status)}</Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Subscription ID</p>
                                    <p className="font-mono text-sm">{payment.subscription.id}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Stripe Subscription ID</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm">{payment.subscription.stripeSubscriptionId}</p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() =>
                                                copyToClipboard(payment.subscription!.stripeSubscriptionId, "Stripe Subscription ID")
                                            }
                                        >
                                            <IconCopy className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Products Card - Full Width with Table */}
                    {payment.products && payment.products.length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Products</CardTitle>
                                <CardDescription>Product details for this payment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Price Interval</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payment.products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="font-mono text-xs break-all max-w-[200px]">
                                                    {product.id}
                                                </TableCell>
                                                <TableCell>{product.name}</TableCell>
                                                <TableCell className="max-w-[300px]">{product.description}</TableCell>
                                                <TableCell>
                                                    {product.activePrice.price} {product.activePrice.currency}
                                                </TableCell>
                                                <TableCell>{product.activePrice.interval}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </Main>
        </>
    );
}
