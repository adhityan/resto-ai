import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconX } from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import { useCustomersStore } from "@/stores/customersStore";
import { useRestaurantsStore } from "@/stores/restaurantsStore";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { Button } from "@/components/ui/button";

export default function CustomersToolbar() {
    const filters = useCustomersStore((s) => s.filters);
    const setFilterValue = useCustomersStore((s) => s.setFilterValue);
    const resetFilters = useCustomersStore((s) => s.resetFilters);
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

    const isFiltered = !!filters.restaurantId;

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
