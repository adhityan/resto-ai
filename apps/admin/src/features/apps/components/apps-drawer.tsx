import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/api";
import { API } from "@/api/routes";
import { useAppsStore } from "@/stores/appsStore";
import type { CreateAppModel, AppModel } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

const schema = z.object({
    name: z.string().min(1, "App name is required"),
    basePath: z.string().min(1, "Base path is required"),
});

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AppsDrawer({ open, onOpenChange }: Props) {
    const qc = useQueryClient();
    const addAppStore = useAppsStore((s) => s.addApp);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            basePath: "",
        },
    });

    const addMutation = useMutation({
        mutationKey: ["add-app"],
        mutationFn: async (data: { name: string; basePath: string }) => {
            const payload: CreateAppModel = { name: data.name, basePath: data.basePath };
            const res = await api.post<AppModel>(API.APPS, payload);
            return res.data;
        },
        onSuccess: (data) => {
            addAppStore(data);
            qc.invalidateQueries({ queryKey: ["apps"] });
            toast.success("App added successfully.");
            onOpenChange(false);
            reset();
        },
        onError: () => {
            toast.error("Failed to add app.");
        },
    });

    const onSubmit = (data: z.infer<typeof schema>) => {
        addMutation.mutate(data);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Add App</SheetTitle>
                    <SheetDescription>Add a new application to your system.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">App Name</Label>
                        <Input id="name" placeholder="My Application" {...register("name")} />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="basePath">Base Path</Label>
                        <Input id="basePath" placeholder="https://example.com/api/v1" {...register("basePath")} />
                        {errors.basePath && <p className="text-xs text-red-500">{errors.basePath.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Add App</Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
