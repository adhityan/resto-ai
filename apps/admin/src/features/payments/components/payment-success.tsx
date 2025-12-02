import { useNavigate, useRouter } from "@tanstack/react-router";
import { cn } from "@/utils/general";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface PaymentSuccessProps extends React.HTMLAttributes<HTMLDivElement> {
    minimal?: boolean;
}

export default function PaymentSuccess({ className, minimal = false }: PaymentSuccessProps) {
    const navigate = useNavigate();
    const { history } = useRouter();

    return (
        <div className={cn("h-svh w-full", className)}>
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                {!minimal && (
                    <div className="mb-4">
                        <CheckCircle2 className="h-24 w-24 text-green-500" strokeWidth={1.5} />
                    </div>
                )}
                <h1 className="text-4xl font-bold">Payment Successful!</h1>
                <span className="mt-2 text-lg font-medium">Your transaction has been completed</span>
                <p className="text-muted-foreground mt-2 max-w-md text-center">
                    Thank you for your payment. A confirmation email has been sent to your registered email address.
                </p>
                {!minimal && (
                    <div className="mt-8 flex gap-4">
                        <Button variant="outline" onClick={() => history.go(-1)}>
                            Go Back
                        </Button>
                        <Button onClick={() => navigate({ to: "/payments" })}>View Payments</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
