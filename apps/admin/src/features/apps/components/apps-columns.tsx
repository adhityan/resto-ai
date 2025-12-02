import { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { App } from "@/stores/appsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<App>[] = [
    {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => row.original.id,
    },
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "isActive",
        header: "Is Active",
        cell: ({ row }) => (
            <Badge variant={row.original.isActive ? "default" : "outline"}>{row.original.isActive ? "Active" : "Inactive"}</Badge>
        ),
    },
    {
        accessorKey: "activeProductsCount",
        header: "Active Products",
        cell: ({ row }) => row.original.activeProductsCount,
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Link to="/settings/apps/$appId" params={{ appId: row.original.id }}>
                <Button size="sm" variant="outline">
                    Manage
                </Button>
            </Link>
        ),
    },
];
