import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import { useProductsStore } from "@/stores/productsStore";
import { MultiSelectFilter } from "@/features/payments/components/multi-select-filter";
import { Button } from "@/components/ui/button";
import type { ApplicationListItemModel } from "@repo/contracts";

interface Props {
    onAdd: () => void;
}

export default function ProductsToolbar({ onAdd }: Props) {
    const filters = useProductsStore((s) => s.filters);
    const setFilterValue = useProductsStore((s) => s.setFilterValue);

    // Fetch apps for filter options
    const { data: apps = [] } = useQuery<ApplicationListItemModel[]>({
        queryKey: ["apps"],
        queryFn: async () => (await api.get(API.APPS)).data,
        refetchOnWindowFocus: false,
    });

    const applicationOptions = useMemo(() => {
        return apps.map((app) => app.name);
    }, [apps]);

    // Create mapping from names to IDs for filtering
    const appNameToId = useMemo(() => {
        const map = new Map<string, string>();
        apps.forEach((app) => map.set(app.name, app.id));
        return map;
    }, [apps]);

    // Create reverse mapping from IDs to names for display
    const appIdToName = useMemo(() => {
        const map = new Map<string, string>();
        apps.forEach((app) => map.set(app.id, app.name));
        return map;
    }, [apps]);

    // Convert selected IDs to names for display
    const selectedAppNames = filters.applications.map((id) => appIdToName.get(id) ?? id).filter(Boolean);

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <MultiSelectFilter
                    title="Application"
                    options={applicationOptions}
                    selected={selectedAppNames}
                    onChange={(names) => {
                        const ids = names.map((name) => appNameToId.get(name)).filter(Boolean) as string[];
                        setFilterValue("applications", ids);
                    }}
                />
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={onAdd} className="space-x-1">
                    <span>Add Product</span>
                    <IconPlus size={16} />
                </Button>
            </div>
        </div>
    );
}
