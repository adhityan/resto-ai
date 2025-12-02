import { createFileRoute } from "@tanstack/react-router";
import PaymentList from "@/features/payments";

interface PaymentsSearchParams {
    status?: string;
    range?: string;
    applications?: string;
    products?: string;
    currencies?: string;
    type?: string;
    skip?: number;
    take?: number;
}

export const Route = createFileRoute("/_authenticated/payments/")({
    component: PaymentList,
    validateSearch: (search: Record<string, unknown>): PaymentsSearchParams => {
        return {
            status: search.status as string | undefined,
            range: search.range as string | undefined,
            applications: search.applications as string | undefined,
            products: search.products as string | undefined,
            currencies: search.currencies as string | undefined,
            type: search.type as string | undefined,
            skip: search.skip as number | undefined,
            take: search.take as number | undefined,
        };
    },
});
