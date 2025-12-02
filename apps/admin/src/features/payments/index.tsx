import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import api from "@/api";
import { API } from "@/api/routes";
import { usePaymentsStore, PaymentListItem } from "@/stores/paymentsStore";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { columns } from "./components/payments-columns";
import PaymentsTable from "./components/payments-table";
import type { PaymentListResponseModel } from "@repo/contracts";

export default function PaymentList() {
    const [isInitialized, setIsInitialized] = useState(false);
    const setFilters = usePaymentsStore((s) => s.setFilters);
    const setPaymentsStore = usePaymentsStore((s) => s.setPayments);
    const filters = usePaymentsStore((s) => s.filters);
    const payments = usePaymentsStore((s) => s.payments);
    const total = usePaymentsStore((s) => s.total);
    const search = useSearch({ from: "/_authenticated/payments/" });
    const navigate = useNavigate();

    // Parse URL search params on mount -> store
    useEffect(() => {
        const { status, range, applications, products, currencies, type, skip, take } = search;
        setFilters({
            status: status?.split(",") ?? [],
            range: range ?? "all",
            applications: applications?.split(",") ?? [],
            products: products?.split(",") ?? [],
            currencies: currencies?.split(",") ?? [],
            type: (type as "one_time" | "subscription" | "all") ?? "all",
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
                range: filters.range !== "all" ? filters.range : undefined,
                applications: filters.applications.length > 0 ? filters.applications.join(",") : undefined,
                products: filters.products.length > 0 ? filters.products.join(",") : undefined,
                currencies: filters.currencies.length > 0 ? filters.currencies.join(",") : undefined,
                type: filters.type !== "all" ? filters.type : undefined,
                skip: filters.skip > 0 ? filters.skip : undefined,
                take: filters.take !== 10 ? filters.take : undefined,
            }),
            replace: true,
        });
    }, [filters, navigate]);

    // Fetch payments via TanStack Query
    const { data: paymentsResp, isFetching } = useQuery<PaymentListResponseModel>({
        queryKey: ["payments", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status.length) params.set("status", filters.status.join(","));
            if (filters.range && filters.range !== "all") params.set("range", filters.range);
            if (filters.applications.length) params.set("applications", filters.applications.join(","));
            if (filters.products.length) params.set("products", filters.products.join(","));
            if (filters.currencies.length) params.set("currencies", filters.currencies.join(","));
            if (filters.type !== "all") params.set("type", filters.type);
            if (filters.skip) params.set("skip", String(filters.skip));
            if (filters.take) params.set("take", String(filters.take));
            const response = await api.get(`${API.PAYMENTS}?${params.toString()}`);
            return response.data as PaymentListResponseModel;
        },
        enabled: isInitialized,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (paymentsResp) {
            setPaymentsStore(paymentsResp.items, paymentsResp.total);
        }
    }, [paymentsResp, setPaymentsStore]);

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
                        <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
                        <p className="text-muted-foreground">Monitor and manage payment transactions.</p>
                    </div>
                </div>
                <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
                    <PaymentsTable data={payments} columns={columns} isFetching={isFetching} total={total} />
                </div>
            </Main>
        </>
    );
}
