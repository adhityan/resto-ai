import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconCopy } from "@tabler/icons-react";
import { format } from "date-fns";
import { toast } from "sonner";
import api from "@/api";
import { ProductDetail } from "@/stores/productsStore";
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

interface Customer {
    id: string;
    name: string;
    email: string;
    createdAt: string;
}

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

export default function ProductDetailPage() {
    const router = useRouter();
    const { productId } = useParams({ strict: false }) as {
        productId: string;
    };

    const { data: product, isLoading } = useQuery<ProductDetail>({
        queryKey: ["product", productId],
        queryFn: async () => (await api.get(API.PRODUCT_DETAIL(productId))).data,
        enabled: !!productId,
    });

    const { data: paymentsResp, isLoading: paymentsLoading } = useQuery<{ items: PaymentListItem[]; total: number }>({
        queryKey: ["product-payments", productId],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("products", productId);
            params.set("skip", "0");
            params.set("take", "10");
            const response = await api.get(`${API.PAYMENTS}?${params.toString()}`);
            return response.data;
        },
        enabled: !!productId,
    });

    const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
        queryKey: ["product-customers", productId],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set("products", productId);
            const response = await api.get(`${API.CUSTOMERS}?${params.toString()}`);
            return response.data;
        },
        enabled: !!productId,
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
                    <div className="text-muted-foreground mb-3 text-sm">Products</div>
                    <div className="flex h-64 items-center justify-center">
                        <p className="text-muted-foreground">Loading product details...</p>
                    </div>
                </Main>
            </>
        );
    }

    if (!product) return null;

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
                <div className="text-muted-foreground mb-3 text-sm">Products &gt; {product.name}</div>

                {/* Page Heading */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">{product.name}</h2>
                        <Badge variant={product.isActive ? "default" : "outline"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            {product.id}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(product.id, "Product ID")}>
                            <IconCopy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6">
                    {/* Product Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Information</CardTitle>
                            <CardDescription>Core product details and pricing</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Description</p>
                                <p className="text-sm">{product.description}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Remote Product ID</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-sm">{product.remoteProductId}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(product.remoteProductId, "Remote Product ID")}
                                    >
                                        <IconCopy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Active Price</p>
                                <p className="text-2xl font-bold">
                                    {product.activePrice.price.toFixed(2)} {product.activePrice.currency}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    {product.activePrice.interval.charAt(0) + product.activePrice.interval.slice(1).toLowerCase()}
                                </p>
                            </div>
                            {product.createdAt && product.updatedAt && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Created At</p>
                                        <p className="text-sm">{format(new Date(product.createdAt), "PPpp")}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Updated At</p>
                                        <p className="text-sm">{format(new Date(product.updatedAt), "PPpp")}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Customers Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Customers</CardTitle>
                            <CardDescription>
                                {customersLoading
                                    ? "Loading customers..."
                                    : `${customers.length} ${customers.length === 1 ? "customer has" : "customers have"} purchased this product`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {customersLoading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <p className="text-muted-foreground">Loading customers...</p>
                                </div>
                            ) : customers.length > 0 ? (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Customer ID</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Created Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customers.map((customer) => (
                                                <TableRow key={customer.id}>
                                                    <TableCell className="font-mono text-sm">
                                                        <Link
                                                            to="/customers/$customerId"
                                                            params={{ customerId: customer.id }}
                                                            className="text-primary underline"
                                                        >
                                                            {customer.id.slice(0, 8)}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{customer.name}</TableCell>
                                                    <TableCell>{customer.email}</TableCell>
                                                    <TableCell>{format(new Date(customer.createdAt), "PPpp")}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex h-32 items-center justify-center">
                                    <p className="text-muted-foreground">No customers found for this product.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payments Card - Full Width */}
                <Card className="mt-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Payments</CardTitle>
                                <CardDescription>
                                    Recent payments for this product {paymentsResp && `(${paymentsResp.total} total)`}
                                </CardDescription>
                            </div>
                            {paymentsResp && paymentsResp.total > 10 && (
                                <Link to="/payments" search={{ products: productId }}>
                                    <Button variant="outline" size="sm">
                                        View All Payments
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {paymentsLoading ? (
                            <div className="flex h-32 items-center justify-center">
                                <p className="text-muted-foreground">Loading payments...</p>
                            </div>
                        ) : paymentsResp && paymentsResp.items.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Payment ID</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Currency</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentsResp.items.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    <Link
                                                        to="/payments/$paymentId"
                                                        params={{ paymentId: payment.id }}
                                                        className="text-primary underline"
                                                    >
                                                        {payment.id.slice(0, 8)}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{payment.amount.toFixed(2)}</TableCell>
                                                <TableCell>{payment.currency}</TableCell>
                                                <TableCell>{payment.customerName}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(payment.status)}>{formatStatus(payment.status)}</Badge>
                                                </TableCell>
                                                <TableCell>{format(new Date(payment.createdAt), "PPpp")}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex h-32 items-center justify-center">
                                <p className="text-muted-foreground">No payments found for this product.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Main>
        </>
    );
}
