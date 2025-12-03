import { createFileRoute } from "@tanstack/react-router";
import CallDetailPage from "@/features/callDetail";

export const Route = createFileRoute("/_authenticated/calls/$callId")({
    component: CallDetailPage,
});

