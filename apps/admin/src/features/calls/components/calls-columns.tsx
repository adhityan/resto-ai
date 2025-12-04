import { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { CallListItem } from "@/stores/callsStore";
import { calculateDurationSeconds, formatDuration } from "@/utils/format";

const getStatusVariant = (status: string) => {
    switch (status) {
        case "COMPLETED":
            return "default";
        case "ACTIVE":
            return "secondary";
        case "FAILED":
            return "destructive";
        default:
            return "outline";
    }
};

export const columns: ColumnDef<CallListItem>[] = [
    {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Call ID" />,
        cell: ({ row }) => (
            <Link
                to="/calls/$callId"
                params={{ callId: row.original.id }}
                className="text-primary hover:underline font-mono text-sm"
            >
                {row.original.id.slice(0, 8)}
            </Link>
        ),
    },
    {
        accessorKey: "customerName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => row.original.customerName || row.original.customerId || "Unknown",
    },
    {
        accessorKey: "restaurantName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Restaurant" />,
        cell: ({ row }) => row.original.restaurantName,
    },
    {
        accessorKey: "endTime",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Duration" />,
        cell: ({ row }) => {
            const duration = calculateDurationSeconds(row.original.startTime, row.original.endTime);
            return formatDuration(duration);
        },
    },
    {
        accessorKey: "language",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Language" />,
        cell: ({ row }) => row.original.language || "-",
    },
    {
        accessorKey: "escalationRequested",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Escalated" />,
        cell: ({ row }) => (
            <Badge variant={row.original.escalationRequested ? "destructive" : "outline"}>
                {row.original.escalationRequested ? "Yes" : "No"}
            </Badge>
        ),
    },
    {
        accessorKey: "startTime",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Start Time" />,
        cell: ({ row }) => format(new Date(row.original.startTime), "PPpp"),
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>,
    },
];

