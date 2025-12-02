import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";

interface Props {
    status: string[];
    setStatus: (status: string[]) => void;
}

export function StatusFilter({ status, setStatus }: Props) {
    return (
        <DataTableFacetedFilter
            title="Status"
            options={[
                { label: "Pending", value: "PENDING" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Due", value: "DUE" },
            ]}
            value={new Set(status)}
            onChange={(newValues) => {
                setStatus(Array.from(newValues));
            }}
        />
    );
}
