"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export class GlobalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo as unknown as Record<string, unknown> });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6 bg-card/60 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-xl">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">A critical error occurred.</h2>
              <p className="text-sm font-bold text-muted-foreground">
                We've captured the error and our team is working on a fix.
              </p>
            </div>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl font-black uppercase text-[11px] tracking-widest h-12"
            >
              Recover
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
