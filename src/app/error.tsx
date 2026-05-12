"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logErrorToSentry } from "@/lib/error-handler";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our monitoring system
    logErrorToSentry(error, { 
      component: "GlobalError",
      digest: error.digest 
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card/60 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-xl">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Something went wrong!</h2>
          <p className="text-sm font-bold text-muted-foreground">
            We apologize for the inconvenience. Our team has been notified and is looking into the issue.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <Button 
            onClick={() => reset()}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-black uppercase text-[11px] tracking-widest h-12 shadow-lg shadow-accent/20"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
            className="w-full rounded-xl font-black uppercase text-[11px] tracking-widest h-12"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
