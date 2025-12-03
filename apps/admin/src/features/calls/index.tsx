import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import api from "@/api";
import { API } from "@/api/routes";
import { useCallsStore, CallListItem } from "@/stores/callsStore";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { columns } from "./components/calls-columns";
import CallsTable from "./components/calls-table";
import type { CallListResponseModel } from "@repo/contracts";

export default function CallList() {
    const [isInitialized, setIsInitialized] = useState(false);
    const setFilters = useCallsStore((s) => s.setFilters);
    const setCallsStore = useCallsStore((s) => s.setCalls);
    const setActiveCallsCount = useCallsStore((s) => s.setActiveCallsCount);
    const filters = useCallsStore((s) => s.filters);
    const calls = useCallsStore((s) => s.calls);
    const total = useCallsStore((s) => s.total);
    const search = useSearch({ from: "/_authenticated/calls/" });
    const navigate = useNavigate();

    // Parse URL search params on mount -> store
    useEffect(() => {
        const { status, restaurantId, startDate, endDate, skip, take } = search;
        setFilters({
            status: status?.split(",") ?? [],
            restaurantId: restaurantId ?? undefined,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
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
                status: filters.status.length > 0 ? filters.status.join(",") : undefined,
                restaurantId: filters.restaurantId ?? undefined,
                startDate: filters.startDate ?? undefined,
                endDate: filters.endDate ?? undefined,
                skip: filters.skip > 0 ? filters.skip : undefined,
                take: filters.take !== 10 ? filters.take : undefined,
            }),
            replace: true,
        });
    }, [filters, navigate]);

    // Fetch calls via TanStack Query
    const { data: callsResp, isFetching } = useQuery<CallListResponseModel>({
        queryKey: ["calls", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status.length) params.set("status", filters.status.join(","));
            if (filters.restaurantId) params.set("restaurantId", filters.restaurantId);
            if (filters.startDate) params.set("startDate", filters.startDate);
            if (filters.endDate) params.set("endDate", filters.endDate);
            if (filters.skip) params.set("skip", String(filters.skip));
            if (filters.take) params.set("take", String(filters.take));
            const response = await api.get(`${API.CALLS}?${params.toString()}`);
            return response.data as CallListResponseModel;
        },
        enabled: isInitialized,
        refetchOnWindowFocus: false,
    });

    // Fetch active calls count
    useQuery({
        queryKey: ["active-calls-count"],
        queryFn: async () => {
            const response = await api.get(API.ACTIVE_CALLS_COUNT);
            setActiveCallsCount(response.data.count);
            return response.data.count;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    useEffect(() => {
        if (callsResp) {
            setCallsStore(callsResp.items as CallListItem[], callsResp.total);
        }
    }, [callsResp, setCallsStore]);

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
                        <h2 className="text-2xl font-bold tracking-tight">Calls</h2>
                        <p className="text-muted-foreground">Monitor and manage restaurant calls.</p>
                    </div>
                </div>
                <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
                    <CallsTable data={calls} columns={columns} isFetching={isFetching} total={total} />
                </div>
            </Main>
        </>
    );
}

