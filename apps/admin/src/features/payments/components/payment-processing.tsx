import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { cn } from "@/utils/general";
import { Hourglass, CheckCircle2, Loader2 } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "@/config/constants";

interface PaymentProcessingProps extends React.HTMLAttributes<HTMLDivElement> {
    minimal?: boolean;
}

export default function PaymentProcessing({ className, minimal = false }: PaymentProcessingProps) {
    const [isProcessed, setIsProcessed] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const search = useSearch({ from: "/(auth)/payment-processing" });

    useEffect(() => {
        const trackSession = async () => {
            const sessionId = (search as any)?.session;

            if (!sessionId) {
                setError("No session ID provided");
                return;
            }

            try {
                // Make unauthenticated API call
                const response = await axios.get(`${API_BASE_URL}/session/track`, {
                    params: { session: sessionId },
                    withCredentials: false,
                });

                const { redirectUrl } = response.data;

                if (redirectUrl) {
                    // Change icon to tick
                    setIsProcessed(true);

                    // Wait a brief moment to show the success icon before redirecting
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 800);
                }
            } catch (err) {
                console.error("Failed to track session:", err);
                setError("Failed to process payment. Please contact support.");
            }
        };

        trackSession();
    }, [search]);

    if (error) {
        return (
            <div className={cn("h-svh w-full", className)}>
                <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                    <h1 className="text-4xl font-bold text-red-500">Error</h1>
                    <p className="text-muted-foreground mt-2 max-w-md text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("h-svh w-full", className)}>
            <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                {!minimal && (
                    <div className="mb-4">
                        {isProcessed ? (
                            <CheckCircle2 className="h-24 w-24 text-green-500" strokeWidth={1.5} />
                        ) : (
                            <Hourglass className="h-24 w-24 animate-pulse text-blue-500" strokeWidth={1.5} />
                        )}
                    </div>
                )}
                <h1 className="text-4xl font-bold">{isProcessed ? "Payment Confirmed!" : "Processing Payment..."}</h1>
                <span className="mt-2 text-lg font-medium">
                    {isProcessed ? "Redirecting you now" : "Please wait while we verify your transaction"}
                </span>
                <p className="text-muted-foreground mt-2 max-w-md text-center">
                    {isProcessed
                        ? "Your payment has been verified successfully."
                        : "This may take a few moments. Please do not close this window."}
                </p>
                {!minimal && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-muted-foreground">Processing...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
