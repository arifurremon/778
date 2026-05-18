"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }

      toast({
        title: "Check your email",
        description: data.message,
      });
      setEmail("");
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border/50 p-8 rounded-3xl shadow-xl">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to login
        </Link>
        
        <div className="mb-8">
          <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4">
            <Mail size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Reset Password</h1>
          <p className="text-sm font-bold text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 rounded-xl bg-background/50"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-widest text-[11px] h-12 rounded-xl"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
