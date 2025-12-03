import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { API } from "@/api/routes";
import { useCustomersStore } from "@/stores/customersStore";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { useRestaurantsStore } from "@/stores/restaurantsStore";

export default function CustomersToolbar() {
    const filters = useCustomersStore((s) => s.filters);
    const setFilterValue = useCustomersStore((s) => s.setFilterValue);
    const restaurants = useRestaurantsStore((s) => s.restaurants);
    const setRestaurants = useRestaurantsStore((s) => s.setRestaurants);

    // Fetch restaurants for filter options
    useQuery({
        queryKey: ["restaurants"],
        queryFn: async () => {
            const response = await api.get(API.RESTAURANTS);
            setRestaurants(response.data);
            return response.data;
        },
    });

    const restaurantOptions = useMemo(() => {
        return restaurants.map((r) => ({
            label: r.name,
            value: r.id,
        }));
    }, [restaurants]);

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <DataTableFacetedFilter
                    title="Restaurant"
                    options={restaurantOptions}
                    value={filters.restaurantId ? new Set([filters.restaurantId]) : new Set()}
                    onChange={(values) => {
                        const value = Array.from(values)[0];
                        setFilterValue("restaurantId", value || undefined);
                    }}
                />
            </div>
        </div>
    );
}
