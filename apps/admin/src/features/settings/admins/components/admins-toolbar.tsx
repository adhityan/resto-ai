import { Table } from "@tanstack/react-table";
import { IconUserPlus } from "@tabler/icons-react";
import { Admin } from "@/stores/adminsStore";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table-view-options";

interface Props {
    table: Table<Admin>;
    onAdd: () => void;
}

export default function AdminsToolbar({ table, onAdd }: Props) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
                {/* Type Filter */}
                {table.getColumn("type") && (
                    <DataTableFacetedFilter
                        title="Type"
                        options={["USER", "ADMIN", "SUPER_ADMIN"].map((r) => ({
                            label: r,
                            value: r,
                        }))}
                        value={new Set((table.getColumn("type")?.getFilterValue() as string[]) ?? [])}
                        onChange={(value) => table.getColumn("type")?.setFilterValue(value.size ? Array.from(value) : undefined)}
                    />
                )}
                {isFiltered && (
                    <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
                        Reset
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <DataTableViewOptions table={table} />
                <Button size="sm" onClick={onAdd} className="space-x-1">
                    <span>Add Admin</span>
                    <IconUserPlus size={16} />
                </Button>
            </div>
        </div>
    );
}
