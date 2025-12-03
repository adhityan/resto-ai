import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import api from "@/api";
import { API } from "@/api/routes";
import { useReservationsStore, ReservationListItem } from "@/stores/reservationsStore";
import { useRestaurantsStore } from "@/stores/restaurantsStore";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { columns } from "./components/reservations-columns";
import ReservationsTable from "./components/reservations-table";
import type { AdminReservationListResponseModel } from "@repo/contracts";

export default function ReservationsList() {
    const [isInitialized, setIsInitialized] = useState(false);
    const setFilters = useReservationsStore((s) => s.setFilters);
    const setReservationsStore = useReservationsStore((s) => s.setReservations);
    const filters = useReservationsStore((s) => s.filters);
    const reservations = useReservationsStore((s) => s.reservations);
    const total = useReservationsStore((s) => s.total);
    const setRestaurants = useRestaurantsStore((s) => s.setRestaurants);
    const search = useSearch({ from: "/_authenticated/reservations/" });
    const navigate = useNavigate();

    // Fetch restaurants for filter
    useQuery({
        queryKey: ["restaurants"],
        queryFn: async () => {
            const response = await api.get(API.RESTAURANTS);
            setRestaurants(response.data);
            return response.data;
        },
    });

    // Parse URL search params on mount -> store
    useEffect(() => {
        const { restaurantId, date, status, skip, take } = search;
        setFilters({
            restaurantId: restaurantId ?? undefined,
            date: date ?? undefined,
            status: status?.split(",") ?? [],
            skip: skip ?? 0,
            take: take ?? 10,
        });
        setIsInitialized(true);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Push store filters -> URL
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        navigate({
            // @ts-expect-error - This is a temporary workaround to unblock the project
            search: (_prev) => ({
                restaurantId: filters.restaurantId ?? undefined,
                date: filters.date ?? undefined,
                status: filters.status.length > 0 ? filters.status.join(",") : undefined,
                skip: filters.skip > 0 ? filters.skip : undefined,
                take: filters.take !== 10 ? filters.take : undefined,
            }),
            replace: true,
        });
    }, [filters, navigate]);

    // Fetch reservations from local database via admin API
    const { data: reservationsResp, isFetching } = useQuery<AdminReservationListResponseModel>({
        queryKey: ["reservations", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.restaurantId) params.set("restaurantId", filters.restaurantId);
            if (filters.date) params.set("date", filters.date);
            if (filters.status.length) params.set("status", filters.status.join(","));
            if (filters.skip) params.set("skip", String(filters.skip));
            if (filters.take) params.set("take", String(filters.take));
            const response = await api.get(`${API.RESERVATIONS}?${params.toString()}`);
            return response.data as AdminReservationListResponseModel;
        },
        enabled: isInitialized,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (reservationsResp) {
            setReservationsStore(reservationsResp.items as ReservationListItem[], reservationsResp.total);
        }
    }, [reservationsResp, setReservationsStore]);

    return (
        <>
            <Header fixed>
                <Search />
                <div className="ml-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Reservations</h2>
                        <p className="text-muted-foreground">View reservations across all restaurants.</p>
                    </div>
                </div>
                <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
                    <ReservationsTable
                        data={reservations}
                        columns={columns}
                        isFetching={isFetching}
                        total={total}
                    />
                </div>
            </Main>
        </>
    );
}
