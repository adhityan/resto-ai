import { createFileRoute } from "@tanstack/react-router";
import CallList from "@/features/calls";

interface CallsSearchParams {
    status?: string;
    restaurantId?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
}

export const Route = createFileRoute("/_authenticated/calls/")({
    component: CallList,
    validateSearch: (search: Record<string, unknown>): CallsSearchParams => {
        return {
            status: search.status as string | undefined,
            restaurantId: search.restaurantId as string | undefined,
            startDate: search.startDate as string | undefined,
            endDate: search.endDate as string | undefined,
            skip: search.skip as number | undefined,
            take: search.take as number | undefined,
        };
    },
});

