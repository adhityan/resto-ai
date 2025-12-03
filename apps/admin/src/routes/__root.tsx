import { lazy, Suspense } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/navigation-progress";
import GeneralError from "@/features/errors/general-error";
import NotFoundError from "@/features/errors/not-found-error";

// Lazy load devtools only in development to avoid bundling in production
const ReactQueryDevtools = import.meta.env.DEV
    ? lazy(() =>
          import("@tanstack/react-query-devtools").then((mod) => ({
              default: mod.ReactQueryDevtools,
          }))
      )
    : () => null;

const TanStackRouterDevtools = import.meta.env.DEV
    ? lazy(() =>
          import("@tanstack/react-router-devtools").then((mod) => ({
              default: mod.TanStackRouterDevtools,
          }))
      )
    : () => null;

export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
}>()({
    component: () => {
        return (
            <>
                <NavigationProgress />
                <Outlet />
                <Toaster duration={50000} />
                {import.meta.env.DEV && (
                    <Suspense fallback={null}>
                        <ReactQueryDevtools buttonPosition="bottom-left" />
                        <TanStackRouterDevtools position="bottom-right" />
                    </Suspense>
                )}
            </>
        );
    },
    notFoundComponent: NotFoundError,
    errorComponent: GeneralError,
});
