import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy } from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/api";
import { CustomerDetail } from "@/stores/customersStore";
import { PaymentListItem } from "@/stores/paymentsStore";
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
import { formatStatus } from "@/utils/format";

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

interface Product {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    remoteProductId: string;
    activePrice: {
        id: string;
        price: number;
        currency: string;
        interval: string;
    };
}

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

    const { data: paymentsResp, isLoading: isLoadingPayments } = useQuery<{ items: PaymentListItem[]; total: number }>({
        queryKey: ["payments", "customer", customerId],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("customerIds", customerId);
            const response = await api.get(`${API.PAYMENTS}?${params.toString()}`);
            return response.data;
        },
        enabled: !!customerId,
    });

    const payments = useMemo(() => paymentsResp?.items ?? [], [paymentsResp?.items]);

    const { data: productsData } = useQuery<{ items: Product[] }>({
        queryKey: ["products", "customer", customerId],
        queryFn: async () => {
            // Fetch all products - we'll filter by the ones the customer purchased
            const response = await api.get(API.PRODUCTS);
            return response.data;
        },
        enabled: !!customerId && payments.length > 0,
    });

    // Filter products to only those the customer has purchased
    const customerProducts = useMemo(() => {
        if (!productsData?.items || payments.length === 0) return [];

        const purchasedProductNames = new Set(payments.map((p) => p.productName));
        return productsData.items.filter((product) => purchasedProductNames.has(product.name));
    }, [productsData, payments]);

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
                <div className="text-muted-foreground mb-3 text-sm">Customers &gt; {customer.name}</div>

                {/* Page Heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
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
                                <p className="text-muted-foreground text-sm font-medium">Name</p>
                                <p className="text-lg font-semibold">{customer.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Email</p>
                                <p className="text-sm">{customer.email}</p>
                            </div>
                            {customer.address && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Address</p>
                                    <p className="text-sm">{customer.address}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Remote Customer ID</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm">{customer.remoteCustomerId}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(customer.remoteCustomerId, "Remote Customer ID")}
                                    >
                                        <IconCopy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Stripe Customer ID</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm">{customer.stripeCustomerId}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(customer.stripeCustomerId, "Stripe Customer ID")}
                                    >
                                        <IconCopy className="h-3 w-3" />
                                    </Button>
                                </div>
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

                    {/* Products Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Products Purchased</CardTitle>
                            <CardDescription>Products this customer has purchased at least once</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingPayments ? (
                                <p className="text-muted-foreground text-sm">Loading products...</p>
                            ) : customerProducts.length > 0 ? (
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
                                        {customerProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell className="max-w-[200px] font-mono text-xs break-all">
                                                    <Link
                                                        to={"/products/$productId"}
                                                        params={{ productId: product.id }}
                                                        className="text-primary underline"
                                                    >
                                                        {product.id}
                                                    </Link>
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
                            ) : (
                                <p className="text-muted-foreground text-sm">No products found for this customer.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payments Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                            <CardDescription>List of all payments made by this customer and their status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingPayments ? (
                                <p className="text-muted-foreground text-sm">Loading payments...</p>
                            ) : payments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Payment ID</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    <Link
                                                        to={"/payments/$paymentId"}
                                                        params={{ paymentId: payment.id }}
                                                        className="text-primary underline"
                                                    >
                                                        {payment.id.slice(0, 8)}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{payment.productName}</TableCell>
                                                <TableCell>
                                                    {payment.amount.toFixed(2)} {payment.currency}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(payment.status)}>{formatStatus(payment.status)}</Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(payment.createdAt), "PPpp")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground text-sm">No payments found for this customer.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </Main>
        </>
    );
}
