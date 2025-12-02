import { useMemo } from "react";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";

interface Props {
    title: string;
    options: string[];
    selected: string[];
    onChange: (values: string[]) => void;
}

export function MultiSelectFilter({ title, options, selected, onChange }: Props) {
    const filterOptions = useMemo(() => {
        return options.map((opt) => ({ label: opt, value: opt }));
    }, [options]);

    return (
        <DataTableFacetedFilter
            title={title}
            options={filterOptions}
            value={new Set(selected)}
            onChange={(newValues) => onChange(Array.from(newValues))}
        />
    );
}
