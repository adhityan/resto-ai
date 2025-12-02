import { createFileRoute } from "@tanstack/react-router";
import AdminDetailPage from "@/features/adminDetail";

export const Route = createFileRoute("/_authenticated/settings/admins/$adminId")({
    component: AdminDetailPage,
});
