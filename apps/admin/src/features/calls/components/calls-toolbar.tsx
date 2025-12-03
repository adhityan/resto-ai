import { useCallsStore } from "@/stores/callsStore";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { IconX } from "@tabler/icons-react";

const statusOptions = [
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Failed", value: "FAILED" },
];

export default function CallsToolbar() {
    const filters = useCallsStore((s) => s.filters);
    const setFilterValue = useCallsStore((s) => s.setFilterValue);
    const resetFilters = useCallsStore((s) => s.resetFilters);

    const isFiltered = filters.status.length > 0 || filters.restaurantId;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <DataTableFacetedFilter
                    title="Status"
                    options={statusOptions}
                    value={new Set(filters.status)}
                    onChange={(values) => setFilterValue("status", Array.from(values))}
                />
                {isFiltered && (
                    <Button variant="ghost" onClick={() => resetFilters()} className="h-8 px-2 lg:px-3">
                        Reset
                        <IconX className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}

