import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { IconArrowLeft, IconPlus, IconTrash, IconCopy, IconCheck } from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import { App, Product, Authentication } from "@/stores/appsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AppDetailPage() {
    const router = useRouter();
    const { appId } = useParams({ strict: false }) as { appId: string };
    const qc = useQueryClient();

    const { data: app } = useQuery<App>({
        queryKey: ["app", appId],
        queryFn: async () => (await api.get(API.APP_DETAIL(appId))).data,
        enabled: !!appId,
    });

    const { data: productsResp } = useQuery<{ items: Product[]; total: number }>({
        queryKey: ["products", appId],
        queryFn: async () => (await api.get(`${API.PRODUCTS}?appId=${appId}`)).data,
        enabled: !!appId,
    });
    const products = productsResp?.items ?? [];

    const { data: authentications = [] } = useQuery<Authentication[]>({
        queryKey: ["authentications", appId],
        queryFn: async () => (await api.get(API.APP_AUTHENTICATIONS(appId))).data,
        enabled: !!appId,
    });

    const [appName, setAppName] = useState(app?.name ?? "");
    const [isActive, setIsActive] = useState(app?.isActive ?? true);
    const [showSecretDialog, setShowSecretDialog] = useState(false);
    const [secretData, setSecretData] = useState<{ clientId: string; clientSecret: string } | null>(null);
    const [copied, setCopied] = useState(false);

    // Update local state when app data changes (only if values differ)
    useEffect(() => {
        if (app && app.name !== appName) {
            setAppName(app.name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [app?.name]);

    useEffect(() => {
        if (app && app.isActive !== isActive) {
            setIsActive(app.isActive);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [app?.isActive]);

    const updateMutation = useMutation({
        mutationFn: async (updates: { name?: string; isActive?: boolean }) => {
            await api.patch(API.APP_DETAIL(appId), updates);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["app", appId] });
            qc.invalidateQueries({ queryKey: ["apps"] });
            toast.success("App updated successfully.");
        },
        onError: () => {
            toast.error("Failed to update app.");
        },
    });

    const deleteAuthMutation = useMutation({
        mutationFn: async (authId: string) => {
            await api.delete(API.DELETE_APP_AUTHENTICATION(appId, authId));
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["authentications", appId] });
            toast.success("Authentication deleted successfully.");
        },
        onError: () => {
            toast.error("Failed to delete authentication.");
        },
    });

    const createAuthMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post(API.CREATE_APP_AUTHENTICATION, { appId });
            return response.data;
        },
        onSuccess: (data) => {
            setSecretData({
                clientId: data.clientId,
                clientSecret: data.clientSecret,
            });
            setShowSecretDialog(true);
            qc.invalidateQueries({ queryKey: ["authentications", appId] });
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

    if (!app) return null;

    return (
        <>
            {/* Back button and breadcrumb */}
            <div className="mb-3 flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => router.history.back()}>
                    <IconArrowLeft />
                </Button>
                <div className="text-muted-foreground text-sm">Apps &gt; {app.name}</div>
            </div>

            {/* Page Title */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">{app.name}</h2>
                <Badge variant="outline">{app.id}</Badge>
            </div>

            {/* App Details Card */}
            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>App Details</CardTitle>
                    <CardDescription>Manage basic app information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="appName">App Name</Label>
                        <div className="flex gap-2">
                            <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} />
                            <Button onClick={() => updateMutation.mutate({ name: appName })} disabled={appName === app.name}>
                                Update
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={(checked) => {
                                setIsActive(checked);
                                updateMutation.mutate({ isActive: checked });
                            }}
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>
                </CardContent>
            </Card>

            {/* App Authentications */}
            <Card className="mb-4">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>App Authentications</CardTitle>
                            <CardDescription>Manage API credentials for this app</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => createAuthMutation.mutate()} disabled={createAuthMutation.isPending}>
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
                            {authentications.map((auth) => (
                                <TableRow key={auth.id}>
                                    <TableCell className="font-mono text-sm">
                                        <pre>{auth.clientId}</pre>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{"*".repeat(12)}</TableCell>
                                    <TableCell>
                                        <Badge variant={auth.isActive ? "default" : "outline"}>
                                            {auth.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" onClick={() => deleteAuthMutation.mutate(auth.id)}>
                                            <IconTrash size={16} className="text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Products Table (Read-only) */}
            <Card>
                <CardHeader>
                    <CardTitle>Products</CardTitle>
                    <CardDescription>Products associated with this app (read-only)</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Prices</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-mono text-sm">{product.id.slice(0, 8)}</TableCell>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.isActive ? "default" : "outline"}>
                                            {product.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {product.activePrice.price} {product.activePrice.currency} ({product.activePrice.interval})
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Client Secret Dialog */}
            <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Authentication Created Successfully</DialogTitle>
                        <DialogDescription>
                            Your client credentials have been generated. Please save the client secret now as it will not be shown again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium">Client ID</Label>
                            <div className="bg-muted mt-1 rounded-md p-3 font-mono text-sm">{secretData?.clientId}</div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Client Secret</Label>
                            <div className="mt-1 flex items-center gap-2">
                                <div className="flex-1 rounded-md border-2 border-yellow-500 bg-yellow-50 p-3 font-mono text-sm break-all dark:bg-yellow-950/20">
                                    {secretData?.clientSecret}
                                </div>
                                <Button variant="outline" size="icon" onClick={handleCopySecret} title="Copy to clipboard">
                                    {copied ? <IconCheck size={18} className="text-green-500" /> : <IconCopy size={18} />}
                                </Button>
                            </div>
                            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-500">
                                ⚠️ This secret will only be shown once. Make sure to save it securely.
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
