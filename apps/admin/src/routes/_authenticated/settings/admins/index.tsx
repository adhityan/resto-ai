import { createFileRoute } from '@tanstack/react-router';
import AdminsPage from '@/features/settings/admins';

export const Route = createFileRoute('/_authenticated/settings/admins/')({
    component: AdminsPage,
});
