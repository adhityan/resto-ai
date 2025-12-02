import { createFileRoute } from "@tanstack/react-router";
import PaymentDetailPage from "@/features/paymentDetail";

export const Route = createFileRoute("/_authenticated/payments/$paymentId")({
    component: PaymentDetailPage,
});
