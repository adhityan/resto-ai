import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconRefresh } from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import { SeatingArea } from "@/stores/restaurantsStore";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface SeatingInfoCardProps {
    restaurantId: string;
    seatingAreas: SeatingArea[];
}

export function SeatingInfoCard({
    restaurantId,
    seatingAreas,
}: SeatingInfoCardProps) {
    const qc = useQueryClient();

    const syncMutation = useMutation({
        mutationFn: async () => {
            await api.post(API.SYNC_SEATING_AREAS(restaurantId));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
            toast.success("Seating areas synced successfully.");
        },
        onError: () => {
            toast.error("Failed to sync seating areas.");
        },
    });

    return (
        <Card className="mb-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Seating Info</CardTitle>
                        <CardDescription>
                            View and sync seating areas from Zenchef
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                    >
                        <IconRefresh
                            size={16}
                            className={`mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`}
                        />
                        {syncMutation.isPending ? "Syncing..." : "Sync"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">
                                Max Capacity
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {seatingAreas.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-center text-muted-foreground"
                                >
                                    No seating areas configured. Click Sync to
                                    fetch from Zenchef.
                                </TableCell>
                            </TableRow>
                        ) : (
                            seatingAreas.map((area) => (
                                <TableRow key={area.id}>
                                    <TableCell className="font-medium">
                                        {area.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {area.description || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {area.maxCapacity}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
