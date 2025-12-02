import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { ProductListItem } from "@/stores/productsStore";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<ProductListItem>[] = [
    {
        accessorKey: "id",
        header: "Product ID",
        cell: ({ row }) => (
            <Link to={"/products/$productId"} params={{ productId: row.original.id }} className="text-primary underline">
                {row.original.id.slice(0, 8)}
            </Link>
        ),
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
            const description = row.original.description;
            return description.length > 50 ? `${description.slice(0, 50)}...` : description;
        },
    },
    {
        accessorKey: "appName",
        header: "Application",
        cell: ({ row }) => row.original.appName || "N/A",
    },
    {
        accessorKey: "activePrice.price",
        header: "Price",
        cell: ({ row }) => {
            const price = row.original.activePrice.price;
            const currency = row.original.activePrice.currency;
            return `${price.toFixed(2)} ${currency}`;
        },
    },
    {
        accessorKey: "activePrice.interval",
        header: "Interval",
        cell: ({ row }) => {
            const interval = row.original.activePrice.interval;
            return interval.charAt(0) + interval.slice(1).toLowerCase();
        },
    },
    {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? "default" : "outline"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>
        ),
    },
];
