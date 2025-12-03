import { createFileRoute } from "@tanstack/react-router";
import RestaurantDetailPage from "@/features/restaurantDetail";

export const Route = createFileRoute("/_authenticated/settings/restaurants/$restaurantId")({
    component: RestaurantDetailPage,
});

