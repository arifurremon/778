
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/brand/logo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (err) {
      setLoginError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6">
        <Link href="/dashboard" className="transition-opacity hover:opacity-90">
          <Logo width={180} className="cursor-pointer mx-auto" />
        </Link>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-headline font-bold tracking-tight text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">Enter your credentials to access your dashboard</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {loginError}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            className="bg-background/50 border-border focus:ring-primary h-11"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button type="button" className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="bg-background/50 border-border focus:ring-primary h-11"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 h-auto mt-2"
        >
          {isSubmitting ? "Authenticating..." : (
            <span className="flex items-center gap-2 text-base">
              Sign In <LogIn className="w-4 h-4" />
            </span>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button
            onClick={onSwitch}
            className="text-primary font-medium hover:underline transition-all"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
