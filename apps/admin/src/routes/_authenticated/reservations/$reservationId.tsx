import { createFileRoute } from "@tanstack/react-router";
import ReservationDetailPage from "@/features/reservationDetail";

export const Route = createFileRoute("/_authenticated/reservations/$reservationId")({
    component: ReservationDetailPage,
});

