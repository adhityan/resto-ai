import { AxiosError } from 'axios';
import { type AnyRouter } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

// Assuming Router type is available

export function handleQueryError(error: unknown, router: AnyRouter) {
    if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
            toast.error('Session expired!');
            useAuthStore.getState().auth.reset();
            // Ensure router.history.location.href is valid or provide a fallback
            const redirect = router.history.location?.href || '/';
            router.navigate({ to: '/sign-in', search: { redirect } });
        }
        if (error.response?.status === 500) {
            toast.error('Internal Server Error!');
            router.navigate({ to: '/500' });
        }
        if (error.response?.status === 403) {
            // router.navigate("/forbidden", { replace: true });
            toast.error('Access Denied!'); // Example: show a toast for 403
        }
    }
    // Optionally, re-throw or handle other error types
}
