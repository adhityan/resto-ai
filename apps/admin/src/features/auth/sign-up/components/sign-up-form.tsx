import { HTMLAttributes } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
// removed zodResolver due to version type mismatch; using manual validation in submit
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import api from "@/api";
import { toast } from "sonner";
// import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/utils/general";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import type { UserRegisterRequest, UserRegisterResponseModel } from "@repo/contracts";
import { API } from "@/api/routes";

type SignUpFormProps = HTMLAttributes<HTMLFormElement>;

const formSchema = z
    .object({
        name: z.string().min(1, { message: "Please enter your name" }),
        email: z.string().min(1, { message: "Please enter your email" }).email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(1, {
                message: "Please enter your password",
            })
            .min(7, {
                message: "Password must be at least 7 characters long",
            }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match.",
        path: ["confirmPassword"],
    });

export function SignUpForm({ className, ...props }: SignUpFormProps) {
    const navigate = useNavigate();

    const form = useForm<{
        name: string;
        email: string;
        password: string;
        confirmPassword: string;
    }>({
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const signUpMutation = useMutation({
        mutationKey: ["signup"],
        mutationFn: async (payload: Omit<z.infer<typeof formSchema>, "confirmPassword">) =>
            (await api.post<UserRegisterResponseModel>(API.REGISTER, payload as UserRegisterRequest)).data,
        onSuccess: () => {
            toast.success("Account created successfully! Please sign in.");
            navigate({ to: "/sign-in" });
        },
        onError: (err) => {
            // eslint-disable-next-line no-console
            console.error(err);
            toast.error("Sign up failed");
        },
    });

    function onSubmit(data: z.infer<typeof formSchema>) {
        const parsed = formSchema.safeParse(data);
        if (!parsed.success) {
            toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
            return;
        }
        const { confirmPassword, ...payload } = data;
        signUpMutation.mutate(payload);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("grid gap-3", className)} {...props}>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" autoComplete="name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
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
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button className="mt-2" disabled={signUpMutation.isPending}>
                    Create Account
                </Button>
            </form>
        </Form>
    );
}
