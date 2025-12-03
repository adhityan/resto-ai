import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api";
import { API } from "@/api/routes";
import { useRestaurantsStore, Restaurant } from "@/stores/restaurantsStore";
import { columns } from "./components/restaurants-columns";
import RestaurantsDrawer from "./components/restaurants-drawer";
import RestaurantsTable from "./components/restaurants-table";

export default function RestaurantsPage() {
    const [openAdd, setOpenAdd] = useState(false);
    const setRestaurants = useRestaurantsStore((s) => s.setRestaurants);
    const restaurants = useRestaurantsStore((s) => s.restaurants);

    const { data } = useQuery({
        queryKey: ["restaurants"],
        queryFn: async () => (await api.get(API.RESTAURANTS)).data,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (data) setRestaurants(data);
    }, [data, setRestaurants]);

    return (
        <>
            <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Restaurants</h2>
                    <p className="text-muted-foreground">Manage restaurants and their configurations.</p>
                </div>
            </div>
            <div className="flex-1 overflow-auto">
                <RestaurantsTable data={restaurants} columns={columns} onAdd={() => setOpenAdd(true)} />
            </div>
            <RestaurantsDrawer open={openAdd} onOpenChange={setOpenAdd} />
        </>
    );
}

