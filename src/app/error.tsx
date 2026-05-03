'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/brand/logo';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full space-y-8 text-center bg-card/50 p-8 rounded-3xl border border-border/50 backdrop-blur-sm shadow-xl">
        <div className="flex justify-center mb-8">
          <Logo width={160} className="mx-auto" />
        </div>
        
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground">Something went wrong!</h2>
        
        <p className="text-muted-foreground text-sm">
          We apologize for the inconvenience. An unexpected error has occurred on our end.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-black/50 p-4 rounded-xl overflow-x-auto text-left border border-border/30">
            <p className="text-xs font-mono text-rose-400 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={() => reset()}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12 rounded-full transition-all active:scale-95"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
          
          <Button 
            variant="outline" 
            asChild
            className="w-full h-12 rounded-full border-border/50 hover:bg-muted"
          >
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
