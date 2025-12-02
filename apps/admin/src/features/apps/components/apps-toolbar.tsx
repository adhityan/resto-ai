import { Table } from "@tanstack/react-table";
import { IconPlus } from "@tabler/icons-react";
import { App } from "@/stores/appsStore";
import { Button } from "@/components/ui/button";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/data-table-view-options";

interface Props {
    table: Table<App>;
    onAdd: () => void;
}

export default function AppsToolbar({ table, onAdd }: Props) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
                {table.getColumn("isActive") && (
                    <DataTableFacetedFilter
                        title="Status"
                        options={[
                            { label: "Active", value: "true" },
                            { label: "Inactive", value: "false" },
                        ]}
                        value={new Set((table.getColumn("isActive")?.getFilterValue() as string[]) ?? [])}
                        onChange={(value) => table.getColumn("isActive")?.setFilterValue(value.size ? Array.from(value) : undefined)}
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
                    <span>Add App</span>
                    <IconPlus size={16} />
                </Button>
            </div>
        </div>
    );
}
