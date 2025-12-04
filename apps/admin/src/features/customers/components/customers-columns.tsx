import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { CustomerListItem } from "@/stores/customersStore";

export const columns: ColumnDef<CustomerListItem>[] = [
    {
        accessorKey: "id",
        header: "Customer ID",
        cell: ({ row }) => (
            <Link to={"/customers/$customerId"} params={{ customerId: row.original.id }} className="text-primary underline">
                {row.original.id.slice(0, 8)}
            </Link>
        ),
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.phone}</span>,
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name || "-",
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
    },
    {
        accessorKey: "restaurantName",
        header: "Restaurant",
    },
    {
        accessorKey: "numberOfCalls",
        header: "Calls",
        cell: ({ row }) => row.original.numberOfCalls,
    },
    {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => format(new Date(row.original.createdAt), "PPpp"),
    },
];
