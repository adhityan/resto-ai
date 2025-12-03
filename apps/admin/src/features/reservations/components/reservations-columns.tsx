import { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { ReservationListItem } from "@/stores/reservationsStore";

const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
        case "CONFIRMED":
            return "default";
        case "WAITING":
        case "WAITING_CUSTOMER":
            return "secondary";
        case "CANCELED":
        case "REFUSED":
        case "NO_SHOWN":
            return "destructive";
        case "ARRIVED":
        case "SEATED":
            return "outline";
        case "OVER":
            return "default";
        default:
            return "outline";
    }
};

const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
        WAITING: "Waiting",
        WAITING_CUSTOMER: "Waiting for Customer",
        CONFIRMED: "Confirmed",
        CANCELED: "Canceled",
        REFUSED: "Refused",
        ARRIVED: "Arrived",
        SEATED: "Seated",
        OVER: "Completed",
        NO_SHOWN: "No Show",
    };
    return statusMap[status.toUpperCase()] || status;
};

export const columns: ColumnDef<ReservationListItem>[] = [
    {
        accessorKey: "zenchefBookingId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Booking ID" />,
        cell: ({ row }) => (
            <Link
                to="/reservations/$reservationId"
                params={{ reservationId: row.original.id }}
                className="text-primary hover:underline font-mono text-sm"
            >
                {row.original.zenchefBookingId}
            </Link>
        ),
    },
    {
        accessorKey: "customerName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => row.original.customerName,
    },
    {
        accessorKey: "date",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => row.original.date,
    },
    {
        accessorKey: "time",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
        cell: ({ row }) => row.original.time,
    },
    {
        accessorKey: "numberOfGuests",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Party Size" />,
        cell: ({ row }) => `${row.original.numberOfGuests} guests`,
    },
    {
        accessorKey: "restaurantName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Restaurant" />,
        cell: ({ row }) => row.original.restaurantName || "-",
    },
    {
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
            <Badge variant={getStatusVariant(row.original.status)}>
                {formatStatus(row.original.status)}
            </Badge>
        ),
    },
];
