import { createFileRoute } from "@tanstack/react-router";
import PaymentProcessing from "@/features/payments/components/payment-processing";

export const Route = createFileRoute("/(auth)/payment-processing")({
    component: PaymentProcessing,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            session: (search.session as string) || "",
        };
    },
});
