import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api";
import { API } from "@/api/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface RestaurantsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function RestaurantsDrawer({ open, onOpenChange }: RestaurantsDrawerProps) {
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [zenchefId, setZenchefId] = useState("");
    const [apiToken, setApiToken] = useState("");
    const qc = useQueryClient();

    const createMutation = useMutation({
        mutationFn: async () => {
            return api.post(API.RESTAURANTS, {
                name,
                incomingPhoneNumber: phoneNumber,
                zenchefId,
                apiToken,
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["restaurants"] });
            toast.success("Restaurant created successfully.");
            onOpenChange(false);
            setName("");
            setPhoneNumber("");
            setZenchefId("");
            setApiToken("");
        },
        onError: () => {
            toast.error("Failed to create restaurant.");
        },
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Add Restaurant</SheetTitle>
                    <SheetDescription>Add a new restaurant to the system.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Restaurant Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Restaurant"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                            id="phoneNumber"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1234567890"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="zenchefId">Zenchef ID</Label>
                        <Input
                            id="zenchefId"
                            value={zenchefId}
                            onChange={(e) => setZenchefId(e.target.value)}
                            placeholder="123456"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="apiToken">Zenchef API Token</Label>
                        <Input
                            id="apiToken"
                            type="password"
                            value={apiToken}
                            onChange={(e) => setApiToken(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={!name || !phoneNumber || !zenchefId || !apiToken || createMutation.isPending}
                    >
                        {createMutation.isPending ? "Creating..." : "Create Restaurant"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

