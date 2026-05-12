"use client"

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center bg-destructive/5 rounded-xl border border-destructive/20 m-4">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            The admin panel encountered an unexpected error. This might be a temporary issue or a data-related problem.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              variant="default" 
              onClick={() => this.setState({ hasError: false })}
              className="gap-2"
            >
              <RefreshCcw className="h-4 w-4" /> Try again
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/admin">
                <Home className="h-4 w-4" /> Admin Dashboard
              </Link>
            </Button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-background border rounded-lg text-left max-w-2xl w-full overflow-auto">
              <p className="text-xs font-mono text-destructive mb-2">{this.state.error?.name}: {this.state.error?.message}</p>
              <pre className="text-[10px] font-mono opacity-50 overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.children;
  }
}
