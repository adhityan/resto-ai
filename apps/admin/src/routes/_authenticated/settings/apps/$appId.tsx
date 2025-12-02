import { createFileRoute } from "@tanstack/react-router";
import AppDetailPage from "@/features/appDetail";

export const Route = createFileRoute("/_authenticated/settings/apps/$appId")({
    component: AppDetailPage,
});
