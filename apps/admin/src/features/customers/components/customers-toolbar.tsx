import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { API } from "@/api/routes";
import { useCustomersStore } from "@/stores/customersStore";
import { MultiSelectFilter } from "@/features/payments/components/multi-select-filter";
import type { ApplicationListItemModel, ProductListResponseModel } from "@repo/contracts";

export default function CustomersToolbar() {
    const filters = useCustomersStore((s) => s.filters);
    const setFilterValue = useCustomersStore((s) => s.setFilterValue);

    // Fetch apps for filter options
    const { data: apps = [] } = useQuery<ApplicationListItemModel[]>({
        queryKey: ["apps"],
        queryFn: async () => (await api.get(API.APPS)).data,
    });

    // Fetch products for filter options
    const { data: productsResp } = useQuery<ProductListResponseModel>({
        queryKey: ["products"],
        queryFn: async () => (await api.get(API.PRODUCTS)).data,
    });

    const applicationOptions = useMemo(() => {
        return apps.map((app) => app.name);
    }, [apps]);

    const productOptions = useMemo(() => {
        return productsResp?.items.map((product) => product.name) ?? [];
    }, [productsResp]);

    // Create mapping from names to IDs for filtering
    const appNameToId = useMemo(() => {
        const map = new Map<string, string>();
        apps.forEach((app) => map.set(app.name, app.id));
        return map;
    }, [apps]);

    const productNameToId = useMemo(() => {
        const map = new Map<string, string>();
        productsResp?.items.forEach((product) => map.set(product.name, product.id));
        return map;
    }, [productsResp]);

    // Create reverse mapping from IDs to names for display
    const appIdToName = useMemo(() => {
        const map = new Map<string, string>();
        apps.forEach((app) => map.set(app.id, app.name));
        return map;
    }, [apps]);

    const productIdToName = useMemo(() => {
        const map = new Map<string, string>();
        productsResp?.items.forEach((product) => map.set(product.id, product.name));
        return map;
    }, [productsResp]);

    // Convert selected IDs to names for display
    const selectedAppNames = filters.applications.map((id) => appIdToName.get(id) ?? id).filter(Boolean);
    const selectedProductNames = filters.products.map((id) => productIdToName.get(id) ?? id).filter(Boolean);

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
                <MultiSelectFilter
                    title="Product"
                    options={productOptions}
                    selected={selectedProductNames}
                    onChange={(names) => {
                        const ids = names.map((name) => productNameToId.get(name)).filter(Boolean) as string[];
                        setFilterValue("products", ids);
                    }}
                />
            </div>
        </div>
    );
}
