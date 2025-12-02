import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";

interface Props {
    type: "one_time" | "subscription" | "all";
    setType: (type: "one_time" | "subscription" | "all") => void;
}

export function PaymentTypeFilter({ type, setType }: Props) {
    return (
        <DataTableFacetedFilter
            title="Type"
            options={[
                { label: "One-time", value: "one_time" },
                { label: "Subscription", value: "subscription" },
            ]}
            value={new Set(type === "all" ? [] : [type])}
            onChange={(newValues) => {
                const newType = (newValues.values().next().value as "one_time" | "subscription" | "all") ?? "all";
                setType(newType);
            }}
        />
    );
}
