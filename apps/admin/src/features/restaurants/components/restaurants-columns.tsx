import { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { Restaurant } from "@/stores/restaurantsStore";

export const columns: ColumnDef<Restaurant>[] = [
    {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Restaurant ID" />,
        cell: ({ row }) => (
            <Link
                to="/settings/restaurants/$restaurantId"
                params={{ restaurantId: row.original.id }}
                className="text-primary hover:underline font-mono text-sm"
            >
                {row.original.id.slice(0, 8)}
            </Link>
        ),
    },
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => row.original.name,
    },
    {
        accessorKey: "restaurantPhoneNumber",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Phone Number" />,
        cell: ({ row }) => row.original.restaurantPhoneNumber,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => format(new Date(row.original.createdAt), "PP"),
    },
    {
        accessorKey: "isActive",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? "default" : "outline"}>
                {row.original.isActive ? "Active" : "Inactive"}
            </Badge>
        ),
    },
];

