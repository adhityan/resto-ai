import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import api from "@/api";
import { API } from "@/api/routes";
import { useProductsStore, ProductListItem } from "@/stores/productsStore";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { columns } from "./components/products-columns";
import ProductsTable from "./components/products-table";
import AddProductDrawer from "./components/add-product-drawer";
import type { ProductListResponseModel } from "@repo/contracts";

export default function ProductsList() {
    const [isInitialized, setIsInitialized] = useState(false);
    const [openAdd, setOpenAdd] = useState(false);
    const setFilters = useProductsStore((s) => s.setFilters);
    const setProductsStore = useProductsStore((s) => s.setProducts);
    const filters = useProductsStore((s) => s.filters);
    const products = useProductsStore((s) => s.products);
    const total = useProductsStore((s) => s.total);
    const search = useSearch({ from: "/_authenticated/products/" });
    const navigate = useNavigate();

    // Parse URL search params on mount -> store
    useEffect(() => {
        const { applications, skip, take } = search;
        setFilters({
            applications: applications?.split(",") ?? [],
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
                applications: filters.applications.length > 0 ? filters.applications.join(",") : undefined,
                skip: filters.skip > 0 ? filters.skip : undefined,
                take: filters.take !== 10 ? filters.take : undefined,
            }),
            replace: true,
        });
    }, [filters, navigate]);

    // Fetch products via TanStack Query
    const { data: productsResp, isFetching } = useQuery<ProductListResponseModel>({
        queryKey: ["products", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            // Note: API only supports single appId, so we use the first selected application
            if (filters.applications.length) params.set("appId", filters.applications[0]);
            if (filters.skip) params.set("skip", String(filters.skip));
            if (filters.take) params.set("take", String(filters.take));
            const response = await api.get(`${API.PRODUCTS}?${params.toString()}`);
            return response.data as ProductList;
        },
        enabled: isInitialized,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (productsResp) {
            setProductsStore(productsResp.items, productsResp.total);
        }
    }, [productsResp, setProductsStore]);

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
                        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
                        <p className="text-muted-foreground">View and manage products across all applications.</p>
                    </div>
                </div>
                <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
                    <ProductsTable data={products} columns={columns} isFetching={isFetching} total={total} onAdd={() => setOpenAdd(true)} />
                </div>
            </Main>
            <AddProductDrawer open={openAdd} onOpenChange={setOpenAdd} />
        </>
    );
}
