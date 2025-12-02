import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { IconTrash } from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import { useAdminsStore } from "@/stores/adminsStore";
import { useAuth } from "@/hooks/useAuth";
import type { UserModel } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import AdminsToolbar from "./admins-toolbar";

interface Props {
    data: UserModel[];
    columns: ColumnDef<UserModel>[];
    onAdd: () => void;
}

export default function AdminsTable({ data, columns, onAdd }: Props) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    const removeAdminStore = useAdminsStore((s) => s.removeAdmin);
    const qc = useQueryClient();
    const { user } = useAuth();

    const delMut = useMutation({
        mutationKey: ["delete-admin"],
        mutationFn: async (id: string) => {
            await api.delete(`${API.ADMINS}/${id}`);
            return id;
        },
        onSuccess: (id) => {
            removeAdminStore(id);
            qc.invalidateQueries({ queryKey: ["admins"] });
        },
    });

    const table = useReactTable({
        data,
        columns,
        state: { columnFilters, sorting, columnVisibility },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <div className="space-y-4">
            <AdminsToolbar table={table} onAdd={onAdd} />
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => {
                                        if (cell.column.id === "actions") {
                                            const isCurrentUser = user?.id === row.original.id;
                                            return (
                                                <TableCell key={cell.id}>
                                                    {!isCurrentUser && (
                                                        <Button size="icon" variant="ghost" onClick={() => delMut.mutate(row.original.id)}>
                                                            <IconTrash size={16} className="text-red-500" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            );
                                        }
                                        return (
                                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    );
}
