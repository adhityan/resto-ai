import { useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export default function AdminDetailPage() {
    const router = useRouter();
    const { adminId } = useParams({ strict: false }) as { adminId: string };

    return (
        <>
            {/* Back button and breadcrumb */}
            <div className="mb-3 flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.history.back()}>
                    <IconArrowLeft />
                </Button>
                <div className="text-muted-foreground text-sm">Admins &gt; {adminId}</div>
            </div>

            {/* Page Title */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Manage Admin</h2>
            </div>

            {/* Placeholder for future implementation */}
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-muted-foreground">Admin management will be implemented here</p>
            </div>
        </>
    );
}
