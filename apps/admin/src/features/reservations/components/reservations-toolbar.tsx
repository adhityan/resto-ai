import { useReservationsStore } from "@/stores/reservationsStore";
import { useRestaurantsStore } from "@/stores/restaurantsStore";
import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconX } from "@tabler/icons-react";

export default function ReservationsToolbar() {
    const filters = useReservationsStore((s) => s.filters);
    const setFilterValue = useReservationsStore((s) => s.setFilterValue);
    const resetFilters = useReservationsStore((s) => s.resetFilters);
    const restaurants = useRestaurantsStore((s) => s.restaurants);

    const restaurantOptions = restaurants.map((r) => ({
        label: r.name,
        value: r.id,
    }));

    const isFiltered = filters.restaurantId || filters.date || filters.status.length > 0;

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
                <Input
                    type="date"
                    value={filters.date || ""}
                    onChange={(e) => setFilterValue("date", e.target.value || undefined)}
                    className="h-8 w-40"
                    placeholder="Filter by date"
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
