import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/api";
import { API } from "@/api/routes";
import { useAdminsStore } from "@/stores/adminsStore";
import type { UserModel, UserRegisterRequest } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";

const schema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AdminsDrawer({ open, onOpenChange }: Props) {
    const qc = useQueryClient();
    const addAdminStore = useAdminsStore((s) => s.addAdmin);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const addMutation = useMutation({
        mutationKey: ["add-admin"],
        mutationFn: async (data: { name: string; email: string; password: string }) => {
            const payload: UserRegisterRequest = { name: data.name, email: data.email, password: data.password };
            const res = await api.post<{ id: string; user: UserModel }>(API.REGISTER, payload);
            return res.data.user;
        },
        onSuccess: (data) => {
            addAdminStore(data);
            qc.invalidateQueries({ queryKey: ["admins"] });
            toast.success("Admin added successfully.");
            onOpenChange(false);
            reset();
        },
        onError: () => {
            toast.error("Failed to add admin.");
        },
    });

    const onSubmit = (data: z.infer<typeof schema>) => {
        addMutation.mutate(data);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Add Admin</SheetTitle>
                    <SheetDescription>Add a new admin to your team.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="John Doe" {...register("name")} />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="user@example.com" {...register("email")} />
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Min 8 characters" {...register("password")} />
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Add Admin</Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
