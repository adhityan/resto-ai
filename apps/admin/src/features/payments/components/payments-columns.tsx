import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { PaymentListItem } from "@/stores/paymentsStore";
import { Badge } from "@/components/ui/badge";
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

export const columns: ColumnDef<PaymentListItem>[] = [
    {
        accessorKey: "id",
        header: "Payment ID",
        cell: ({ row }) => (
            <Link to={"/payments/$paymentId"} params={{ paymentId: row.original.id }} className="text-primary underline">
                {row.original.id.slice(0, 8)}
            </Link>
        ),
    },
    {
        accessorKey: "productName",
        header: "Product",
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const amount = row.original.amount;
            const currency = row.original.currency;
            return `${amount.toFixed(2)} ${currency}`;
        },
    },
    {
        accessorKey: "currency",
        header: "Currency",
    },
    {
        accessorKey: "customerName",
        header: "Customer Name",
    },
    {
        accessorKey: "applicationName",
        header: "Application",
    },
    {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => format(new Date(row.original.createdAt), "PPpp"),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{formatStatus(row.original.status)}</Badge>,
    },
];
