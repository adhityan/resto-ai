import { createFileRoute } from "@tanstack/react-router";
import ReservationsList from "@/features/reservations";

interface ReservationsSearchParams {
    restaurantId?: string;
    date?: string;
    status?: string;
    skip?: number;
    take?: number;
}

export const Route = createFileRoute("/_authenticated/reservations/")({
    component: ReservationsList,
    validateSearch: (search: Record<string, unknown>): ReservationsSearchParams => {
        return {
            restaurantId: search.restaurantId as string | undefined,
            date: search.date as string | undefined,
            status: search.status as string | undefined,
            skip: search.skip as number | undefined,
            take: search.take as number | undefined,
        };
    },
});

