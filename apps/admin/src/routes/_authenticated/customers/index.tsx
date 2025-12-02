import { createFileRoute } from "@tanstack/react-router";
import CustomerList from "@/features/customers";

interface CustomersSearchParams {
    applications?: string;
    products?: string;
    skip?: number;
    take?: number;
}

export const Route = createFileRoute("/_authenticated/customers/")({
    component: CustomerList,
    validateSearch: (search: Record<string, unknown>): CustomersSearchParams => {
        return {
            applications: search.applications as string | undefined,
            products: search.products as string | undefined,
            skip: search.skip as number | undefined,
            take: search.take as number | undefined,
        };
    },
});
