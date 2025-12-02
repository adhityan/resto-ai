import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { PaymentListItem, usePaymentsStore } from "@/stores/paymentsStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import PaymentsToolbar from "./payments-toolbar";

interface Props {
    data: PaymentListItem[];
    columns: ColumnDef<PaymentListItem>[];
    isFetching: boolean;
    total: number;
}

export default function PaymentsTable({ data, columns, total }: Props) {
    const setPagination = usePaymentsStore((s) => s.setPagination);
    const filters = usePaymentsStore((s) => s.filters);

    const table = useReactTable({
        data,
        columns,
        pageCount: Math.ceil(total / filters.take),
        state: {
            pagination: {
                pageIndex: filters.skip / filters.take,
                pageSize: filters.take,
            },
        },
        onPaginationChange: (updater) => {
            if (typeof updater === "function") {
                const next = updater({
                    pageIndex: filters.skip / filters.take,
                    pageSize: filters.take,
                });
                setPagination({
                    skip: next.pageIndex * next.pageSize,
                    take: next.pageSize,
                });
            }
        },
        manualPagination: true,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
    });

    return (
        <div className="space-y-4">
            <PaymentsToolbar />
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="group/row">
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
                                <TableRow key={row.id} className="group/row">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
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
            <DataTablePagination table={table} total={total} filters={filters} />
        </div>
    );
}
