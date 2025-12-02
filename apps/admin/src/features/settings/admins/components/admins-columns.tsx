import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { ColumnDef } from "@tanstack/react-table";
import { IconTrash } from "@tabler/icons-react";
import type { UserModel } from "@repo/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { inArray } from "@/utils/table";

export const columns: ColumnDef<UserModel>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
            <Link to="/settings/admins/$adminId" params={{ adminId: row.original.id }} className="text-primary underline">
                {row.original.name}
            </Link>
        ),
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="secondary">{row.original.type}</Badge>,
        filterFn: inArray(),
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
            const date = new Date(row.original.createdAt);
            return isNaN(date.getTime()) ? "-" : format(date, "PP");
        },
    },
    {
        id: "actions",
        cell: () => (
            <Button size="icon" variant="ghost">
                <IconTrash size={16} className="text-red-500" />
            </Button>
        ),
    },
];
