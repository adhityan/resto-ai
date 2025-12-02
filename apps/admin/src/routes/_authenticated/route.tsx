import { useEffect } from "react";
import Cookies from "js-cookie";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/general";
import { SearchProvider } from "@/context/search-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import SkipToMain from "@/components/skip-to-main";
import api from "@/api";
import { API } from "@/api/routes";
import type { UserModel } from "@repo/contracts";

export const Route = createFileRoute("/_authenticated")({
    beforeLoad: ({ location }) => {
        const token = useAuthStore.getState().auth.accessToken;
        if (!token) {
            throw redirect({
                to: "/sign-in",
                search: { redirect: location.href },
            });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    const defaultOpen = Cookies.get("sidebar_state") !== "false";
    const user = useAuthStore((s) => s.auth.user);
    const setUser = useAuthStore((s) => s.auth.setUser);

    useEffect(() => {
        // Fetch current user if not already loaded
        if (!user) {
            api.get<UserModel>(API.ME)
                .then((response) => {
                    const userData = response.data;
                    setUser({
                        id: userData.id,
                        email: userData.email,
                        name: userData.name,
                        type: userData.type,
                        isActive: true,
                    });
                })
                .catch(() => {
                    // Silently fail - user will be redirected on next authenticated request
                });
        }
    }, [user, setUser]);

    return (
        <SearchProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
                <SkipToMain />
                <AppSidebar />
                <div
                    id="content"
                    className={cn(
                        "ml-auto w-full max-w-full",
                        "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
                        "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
                        "sm:transition-[width] sm:duration-200 sm:ease-linear",
                        "flex h-svh flex-col",
                        "group-data-[scroll-locked=1]/body:h-full",
                        "has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh"
                    )}
                >
                    <Outlet />
                </div>
            </SidebarProvider>
        </SearchProvider>
    );
}
