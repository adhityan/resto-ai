import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";
import { PaymentListFilters } from "@/stores/paymentsStore";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
    total?: number;
    filters?: PaymentListFilters;
}

export function DataTablePagination<TData>({ table, total, filters }: DataTablePaginationProps<TData>) {
    const isServerSide = total !== undefined && filters !== undefined;

    const pageCount = isServerSide ? Math.ceil(total / filters.take) : table.getPageCount();

    const pageIndex = isServerSide ? Math.floor(filters.skip / filters.take) : table.getState().pagination.pageIndex;

    const canPreviousPage = isServerSide ? filters.skip > 0 : table.getCanPreviousPage();

    const canNextPage = isServerSide ? filters.skip + filters.take < total : table.getCanNextPage();

    return (
        <div className="flex items-center justify-between overflow-clip px-2" style={{ overflowClipMargin: 1 }}>
            <div className="text-muted-foreground hidden flex-1 text-sm sm:block">
                {table.getFilteredSelectedRowModel().rows.length} of {isServerSide ? total : table.getFilteredRowModel().rows.length} row(s)
                selected.
            </div>
            <div className="flex items-center sm:space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="hidden text-sm font-medium sm:block">Rows per page</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={table.getState().pagination.pageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {pageIndex + 1} of {pageCount}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!canPreviousPage}
                    >
                        <span className="sr-only">Go to first page</span>
                        <DoubleArrowLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!canPreviousPage}>
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!canNextPage}>
                        <span className="sr-only">Go to next page</span>
                        <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        className="hidden h-8 w-8 p-0 lg:flex"
                        onClick={() => table.setPageIndex(pageCount - 1)}
                        disabled={!canNextPage}
                    >
                        <span className="sr-only">Go to last page</span>
                        <DoubleArrowRightIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
