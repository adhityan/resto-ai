import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import api from "@/api";
import { API } from "@/api/routes";
import { useCustomersStore, CustomerListItem } from "@/stores/customersStore";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { columns } from "./components/customers-columns";
import CustomersTable from "./components/customers-table";
import type { CustomerListResponseModel } from "@repo/contracts";

export default function CustomerList() {
    const [isInitialized, setIsInitialized] = useState(false);
    const setFilters = useCustomersStore((s) => s.setFilters);
    const setCustomersStore = useCustomersStore((s) => s.setCustomers);
    const filters = useCustomersStore((s) => s.filters);
    const customers = useCustomersStore((s) => s.customers);
    const total = useCustomersStore((s) => s.total);
    const search = useSearch({ from: "/_authenticated/customers/" });
    const navigate = useNavigate();

    // Parse URL search params on mount -> store
    useEffect(() => {
        const { restaurantId, skip, take } = search;
        setFilters({
            restaurantId: restaurantId ?? undefined,
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
                skip: filters.skip > 0 ? filters.skip : undefined,
                take: filters.take !== 10 ? filters.take : undefined,
            }),
            replace: true,
        });
    }, [filters, navigate]);

    // Fetch customers via TanStack Query
    const { data: customersResp, isFetching } = useQuery<CustomerListResponseModel>({
        queryKey: ["customers", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.restaurantId) params.set("restaurantId", filters.restaurantId);
            if (filters.skip) params.set("skip", String(filters.skip));
            if (filters.take) params.set("take", String(filters.take));
            const response = await api.get(`${API.CUSTOMERS}?${params.toString()}`);
            return response.data as CustomerListResponseModel;
        },
        enabled: isInitialized,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (customersResp) {
            setCustomersStore(customersResp.items as CustomerListItem[], customersResp.total);
        }
    }, [customersResp, setCustomersStore]);

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
                        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
                        <p className="text-muted-foreground">View and manage customers.</p>
                    </div>
                </div>
                <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
                    <CustomersTable data={customers} columns={columns} isFetching={isFetching} total={total} />
                </div>
            </Main>
        </>
    );
}
