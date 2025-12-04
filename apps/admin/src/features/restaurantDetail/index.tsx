import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import {
    IconArrowLeft,
    IconPlus,
    IconTrash,
    IconCopy,
    IconCheck,
} from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import {
    Restaurant,
    RestaurantAuthentication,
} from "@/stores/restaurantsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TestAgentCard } from "./test-agent-card";
import { SeatingInfoCard } from "./seating-info-card";

export default function RestaurantDetailPage() {
    const router = useRouter();
    const { restaurantId } = useParams({ strict: false }) as {
        restaurantId: string;
    };
    const qc = useQueryClient();

    const { data: restaurant } = useQuery<Restaurant>({
        queryKey: ["restaurant", restaurantId],
        queryFn: async () =>
            (await api.get(API.RESTAURANT_DETAIL(restaurantId))).data,
        enabled: !!restaurantId,
    });

    const { data: authentications = [] } = useQuery<RestaurantAuthentication[]>(
        {
            queryKey: ["authentications", restaurantId],
            queryFn: async () =>
                (await api.get(API.RESTAURANT_AUTHENTICATIONS(restaurantId)))
                    .data,
            enabled: !!restaurantId,
        }
    );

    const [restaurantName, setRestaurantName] = useState(
        restaurant?.name ?? ""
    );
    const [website, setWebsite] = useState(restaurant?.website ?? "");
    const [information, setInformation] = useState(
        restaurant?.information ?? ""
    );
    const [isActive, setIsActive] = useState(restaurant?.isActive ?? true);
    const [showSecretDialog, setShowSecretDialog] = useState(false);
    const [secretData, setSecretData] = useState<{
        clientId: string;
        clientSecret: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    // Update local state when restaurant data changes (only if values differ)
    useEffect(() => {
        if (restaurant && restaurant.name !== restaurantName) {
            setRestaurantName(restaurant.name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurant?.name]);

    useEffect(() => {
        if (restaurant && restaurant.website !== website) {
            setWebsite(restaurant.website);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurant?.website]);

    useEffect(() => {
        if (restaurant && restaurant.information !== information) {
            setInformation(restaurant.information);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurant?.information]);

    useEffect(() => {
        if (restaurant && restaurant.isActive !== isActive) {
            setIsActive(restaurant.isActive);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurant?.isActive]);

    // Check if any field has changed
    const hasChanges =
        restaurantName !== (restaurant?.name ?? "") ||
        website !== (restaurant?.website ?? "") ||
        information !== (restaurant?.information ?? "") ||
        isActive !== (restaurant?.isActive ?? true);

    const updateMutation = useMutation({
        mutationFn: async (updates: {
            name?: string;
            website?: string;
            information?: string;
            isActive?: boolean;
        }) => {
            await api.patch(API.RESTAURANT_DETAIL(restaurantId), updates);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
            qc.invalidateQueries({ queryKey: ["restaurants"] });
            toast.success("Restaurant updated successfully.");
        },
        onError: () => {
            toast.error("Failed to update restaurant.");
        },
    });

    const handleUpdate = () => {
        updateMutation.mutate({
            name: restaurantName,
            website,
            information,
            isActive,
        });
    };

    const deleteAuthMutation = useMutation({
        mutationFn: async (authId: string) => {
            await api.delete(
                API.DELETE_RESTAURANT_AUTHENTICATION(restaurantId, authId)
            );
        },
        onSuccess: () => {
            qc.invalidateQueries({
                queryKey: ["authentications", restaurantId],
            });
            toast.success("Authentication deleted successfully.");
        },
        onError: () => {
            toast.error("Failed to delete authentication.");
        },
    });

    const createAuthMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(
                API.RESTAURANT_AUTHENTICATIONS(restaurantId)
            );
            return response.data;
        },
        onSuccess: (data) => {
            setSecretData({
                clientId: data.clientId,
                clientSecret: data.clientSecret,
            });
            setShowSecretDialog(true);
            qc.invalidateQueries({
                queryKey: ["authentications", restaurantId],
            });
            toast.success("Authentication created successfully.");
        },
        onError: () => {
            toast.error("Failed to create authentication.");
        },
    });

    const handleCopySecret = () => {
        if (secretData?.clientSecret) {
            navigator.clipboard.writeText(secretData.clientSecret);
            setCopied(true);
            toast.success("Client secret copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCloseDialog = () => {
        setShowSecretDialog(false);
        setCopied(false);
    };

    if (!restaurant) return null;

    return (
        <>
            {/* Back button and breadcrumb */}
            <div className="mb-3 flex items-center gap-3">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.history.back()}
                >
                    <IconArrowLeft />
                </Button>
                <div className="text-muted-foreground text-sm">
                    Restaurants &gt; {restaurant.name}
                </div>
            </div>

            {/* Page Title */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">
                    {restaurant.name}
                </h2>
                <Badge variant="outline">{restaurant.id}</Badge>
            </div>

            {/* Restaurant Details Card */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Restaurant Details</CardTitle>
                    <CardDescription>
                        Manage basic restaurant information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="restaurantName">Restaurant Name</Label>
                        <Input
                            id="restaurantName"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            placeholder="https://example.com"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="information">Instructions</Label>
                        <Textarea
                            id="information"
                            placeholder="Special instructions for the AI agent..."
                            value={information}
                            onChange={(e) => setInformation(e.target.value)}
                            rows={4}
                            className="max-h-48 overflow-y-auto"
                        />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="isActive">Active</Label>
                        </div>
                        <Button
                            onClick={handleUpdate}
                            disabled={!hasChanges || updateMutation.isPending}
                        >
                            {updateMutation.isPending
                                ? "Updating..."
                                : "Update"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Seating Info Card */}
            <SeatingInfoCard
                restaurantId={restaurantId}
                seatingAreas={restaurant.seatingAreas ?? []}
            />

            {/* Restaurant Authentications */}
            <Card className="mb-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>API Authentications</CardTitle>
                            <CardDescription>
                                Manage API credentials for this restaurant
                            </CardDescription>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => createAuthMutation.mutate()}
                            disabled={createAuthMutation.isPending}
                        >
                            <IconPlus size={16} className="mr-1" />
                            Add Authentication
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Client ID</TableHead>
                                <TableHead>Client Secret</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {authentications.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center text-muted-foreground"
                                    >
                                        No authentications configured
                                    </TableCell>
                                </TableRow>
                            ) : (
                                authentications.map((auth) => (
                                    <TableRow key={auth.id}>
                                        <TableCell className="font-mono text-sm">
                                            <pre>{auth.clientId}</pre>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {"*".repeat(12)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    auth.isActive
                                                        ? "default"
                                                        : "outline"
                                                }
                                            >
                                                {auth.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() =>
                                                    deleteAuthMutation.mutate(
                                                        auth.id
                                                    )
                                                }
                                            >
                                                <IconTrash
                                                    size={16}
                                                    className="text-red-500"
                                                />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Test Agent Card */}
            <TestAgentCard restaurantId={restaurantId} />

            {/* Client Secret Dialog */}
            <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Authentication Created Successfully
                        </DialogTitle>
                        <DialogDescription>
                            Your client credentials have been generated. Please
                            save the client secret now as it will not be shown
                            again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium">
                                Client ID
                            </Label>
                            <div className="bg-muted mt-1 rounded-md p-3 font-mono text-sm">
                                {secretData?.clientId}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">
                                Client Secret
                            </Label>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="flex-1 rounded-md border-2 border-yellow-500 bg-yellow-50 p-3 font-mono text-sm break-all dark:bg-yellow-950/20">
                                    {secretData?.clientSecret}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopySecret}
                                    title="Copy to clipboard"
                                >
                                    {copied ? (
                                        <IconCheck
                                            size={18}
                                            className="text-green-500"
                                        />
                                    ) : (
                                        <IconCopy size={18} />
                                    )}
                                </Button>
                            </div>
                            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
                                Warning: This secret will only be shown once.
                                Make sure to save it securely.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCloseDialog}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
