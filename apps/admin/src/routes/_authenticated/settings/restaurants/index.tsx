import { createFileRoute } from "@tanstack/react-router";
import RestaurantsPage from "@/features/restaurants";

export const Route = createFileRoute("/_authenticated/settings/restaurants/")({
    component: RestaurantsPage,
});

