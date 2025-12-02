type CallStatusFilter = "ongoing" | "finished" | "all";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";

interface Props {
    status: CallStatusFilter;
    setStatus: (status: CallStatusFilter) => void;
}

export function StatusFilter({ status, setStatus }: Props) {
    return (
        <DataTableFacetedFilter
            title="Status"
            options={[
                { label: "Ongoing", value: "ongoing" },
                { label: "Finished", value: "finished" },
            ]}
            value={new Set(status === "all" ? [] : [status])}
            onChange={(newValues) => {
                const newStatus = (newValues.values().next().value as CallStatusFilter) ?? "all";
                setStatus(newStatus);
            }}
        />
    );
}
