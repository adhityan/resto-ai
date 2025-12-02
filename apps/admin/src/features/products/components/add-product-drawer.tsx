import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import api from "@/api";
import { API } from "@/api/routes";
import { useProductsStore } from "@/stores/productsStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AxiosError } from "axios";
import type { ApplicationListItemModel, SupportedCurrenciesResponseModel } from "@repo/contracts";

const schema = z.object({
    appId: z.string().min(1, "App is required"),
    name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
    description: z.string().min(1, "Description is required").max(1000, "Description must be less than 1000 characters"),
    remoteProductId: z.string().min(1, "Remote Product ID is required").max(100, "Remote Product ID must be less than 100 characters"),
    price: z
        .string()
        .min(0, "Price must be at least 0")
        .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Price must be a valid number"),
    currency: z.string().min(1, "Currency is required"),
    interval: z.enum(["ONE_TIME", "WEEKLY", "MONTHLY", "YEARLY"], {
        message: "Invalid interval",
    }),
    metadata: z.array(
        z.object({
            key: z.string().min(1, "Key is required"),
            value: z.string().min(1, "Value is required"),
        })
    ),
});

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AddProductDrawer({ open, onOpenChange }: Props) {
    const qc = useQueryClient();
    const addProductStore = useProductsStore((s) => s.addProduct);
    const auth = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            appId: "",
            name: "",
            description: "",
            remoteProductId: "",
            price: "",
            currency: "usd",
            interval: "ONE_TIME",
            metadata: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "metadata",
    });

    // Fetch apps for dropdown
    const { data: apps = [] } = useQuery<ApplicationListItemModel[]>({
        queryKey: ["apps"],
        queryFn: async () => (await api.get(API.APPS)).data,
        refetchOnWindowFocus: false,
    });

    // Fetch supported currencies
    const { data: currenciesData, isLoading: currenciesLoading } = useQuery<SupportedCurrenciesResponseModel>({
        queryKey: ["supported-currencies"],
        queryFn: async () => (await api.get(API.SUPPORTED_CURRENCIES)).data,
        refetchOnWindowFocus: false,
    });

    const supportedCurrencies = currenciesData?.currencies || [];

    const addMutation = useMutation({
        mutationKey: ["add-product"],
        mutationFn: async (data: z.infer<typeof schema>) => {
            // Build metadata object
            const metadata: Record<string, string> = {
                createdByAdmin: auth.user?.id || "",
            };

            // Add user-provided metadata
            data.metadata.forEach((item) => {
                metadata[item.key] = item.value;
            });

            const payload = {
                appId: data.appId,
                name: data.name,
                description: data.description,
                remoteProductId: data.remoteProductId,
                price: {
                    price: parseFloat(data.price),
                    currency: data.currency,
                    interval: data.interval,
                },
                metadata,
            };

            const res = await api.post(API.PRODUCTS, payload);
            return res.data;
        },
        onSuccess: (data) => {
            addProductStore(data);
            qc.invalidateQueries({ queryKey: ["products"] });
            toast.success("Product added successfully.");
            onOpenChange(false);
            reset();
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error?.response?.data?.message || "Failed to add product.");
        },
    });

    const onSubmit = (data: z.infer<typeof schema>) => {
        addMutation.mutate(data);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Add Product</SheetTitle>
                    <SheetDescription>Add a new product to an application.</SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="appId">Application</Label>
                        <Controller
                            name="appId"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an app" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {apps.map((app) => (
                                            <SelectItem key={app.id} value={app.id}>
                                                {app.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.appId && <p className="text-xs text-red-500">{errors.appId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" placeholder="Product name" {...register("name")} />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Product description" {...register("description")} />
                        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remoteProductId">Remote Product ID</Label>
                        <Input id="remoteProductId" placeholder="e.g., prod_xyz123" {...register("remoteProductId")} />
                        {errors.remoteProductId && <p className="text-xs text-red-500">{errors.remoteProductId.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" {...register("price")} />
                        {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Controller
                            name="currency"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange} disabled={currenciesLoading}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={currenciesLoading ? "Loading currencies..." : "Select currency"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {supportedCurrencies.map((currency) => (
                                            <SelectItem key={currency} value={currency}>
                                                {currency.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.currency && <p className="text-xs text-red-500">{errors.currency.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="interval">Interval</Label>
                        <Controller
                            name="interval"
                            control={control}
                            render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select interval" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="YEARLY">Yearly</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.interval && <p className="text-xs text-red-500">{errors.interval.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Metadata</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => append({ key: "", value: "" })}
                                className="space-x-1"
                            >
                                <span>Add</span>
                                <IconPlus size={14} />
                            </Button>
                        </div>
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex items-start gap-2">
                                <div className="flex-1 space-y-1">
                                    <Input placeholder="Key" {...register(`metadata.${index}.key` as const)} />
                                    {errors.metadata?.[index]?.key && (
                                        <p className="text-xs text-red-500">{errors.metadata[index]?.key?.message}</p>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Input placeholder="Value" {...register(`metadata.${index}.value` as const)} />
                                    {errors.metadata?.[index]?.value && (
                                        <p className="text-xs text-red-500">{errors.metadata[index]?.value?.message}</p>
                                    )}
                                </div>
                                <Button type="button" size="icon" variant="ghost" onClick={() => remove(index)} className="mt-0">
                                    <IconTrash size={16} className="text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={addMutation.isPending}>
                            {addMutation.isPending ? "Adding..." : "Add Product"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
