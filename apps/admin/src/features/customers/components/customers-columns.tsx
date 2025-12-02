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
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "remoteCustomerId",
        header: "Remote Customer ID",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.remoteCustomerId}</span>,
    },
    {
        accessorKey: "createdAt",
        header: "Created Date",
        cell: ({ row }) => format(new Date(row.original.createdAt), "PPpp"),
    },
];
