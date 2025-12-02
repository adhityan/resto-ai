import { createFileRoute } from "@tanstack/react-router";
import ProductsList from "@/features/products";

type ProductsSearch = {
    applications?: string;
    skip?: number;
    take?: number;
};

export const Route = createFileRoute("/_authenticated/products/")({
    component: ProductsList,
    validateSearch: (search: Record<string, unknown>): ProductsSearch => {
        return {
            applications: typeof search.applications === "string" ? search.applications : undefined,
            skip: typeof search.skip === "number" ? search.skip : undefined,
            take: typeof search.take === "number" ? search.take : undefined,
        };
    },
});
