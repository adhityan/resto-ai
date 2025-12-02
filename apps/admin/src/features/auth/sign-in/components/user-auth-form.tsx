import { HTMLAttributes, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
// removed zodResolver due to version type mismatch; using manual validation in submit
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import api from "@/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/general";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import type { UserLoginRequest, UserLoginResponse } from "@repo/contracts";
import { API } from "@/api/routes";

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

const formSchema = z.object({
    email: z.string().min(1, { message: "Please enter your email" }).email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(1, {
            message: "Please enter your password",
        })
        .min(7, {
            message: "Password must be at least 7 characters long",
        }),
});

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as { redirect?: string };
    const setAccessToken = useAuthStore((s) => s.auth.setAccessToken);

    const form = useForm<{
        email: string;
        password: string;
    }>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const loginMutation = useMutation({
        mutationKey: ["login"],
        mutationFn: async (payload: z.infer<typeof formSchema>) =>
            (await api.post<UserLoginResponse>(API.LOGIN, payload as UserLoginRequest)).data,
        onSuccess: (data) => {
            setAccessToken(data.token);
            useAuthStore.getState().auth.setUser(data.entity);
            const redirectTo = search.redirect ?? "/";
            navigate({ to: redirectTo });
        },
        onError: (err) => {
            // eslint-disable-next-line no-console
            console.error(err);
            toast.error("Login failed");
        },
        onSettled: () => setIsLoading(false),
    });

    async function onSubmit(_data: z.infer<typeof formSchema>) {
        const parsed = formSchema.safeParse(_data);
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }
        setIsLoading(true);
        loginMutation.mutate(_data);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("grid gap-3", className)} {...props}>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" autoComplete="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem className="relative">
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder="********" autoComplete="current-password" {...field} />
                            </FormControl>
                            <FormMessage />
                            <Link
                                to="/forgot-password"
                                className="text-muted-foreground absolute -top-0.5 right-0 text-sm font-medium hover:opacity-75"
                            >
                                Forgot password?
                            </Link>
                        </FormItem>
                    )}
                />
                <Button className="mt-2" disabled={isLoading}>
                    Login
                </Button>
            </form>
        </Form>
    );
}
