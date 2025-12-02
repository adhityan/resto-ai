import { createFileRoute } from "@tanstack/react-router";
import PaymentSuccess from "@/features/payments/components/payment-success";

export const Route = createFileRoute("/(errors)/payment-success")({
    component: PaymentSuccess,
});
