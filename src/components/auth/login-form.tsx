"use client";

import AuthDivider from "@/components/auth/auth-divider";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { authStyles } from "@/lib/design/auth-styles";
import { loginPasswordSchema } from "@/lib/validation/password";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: loginPasswordSchema,
});

type LoginFormValues = z.infer<typeof loginSchema>;

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Access denied. Your account may be suspended or requires password sign-in.",
  OAuthAccountNotLinked:
    "This email is registered with a password. Please sign in with email and password.",
  OAuthSignin: "Google sign-in failed. Please try again or use email and password.",
};

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (!oauthError || oauthError === "EmailNotVerified") return;

    const message =
      OAUTH_ERROR_MESSAGES[oauthError] ??
      "An authentication error occurred. Please try again.";
    setLoginError(message);
  }, [searchParams]);

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    setIsEmailUnverified(false);
    setResendSuccess(false);
    try {
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password. Please try again.";
      if (message.includes("EmailNotVerified") || message.includes("verify your email")) {
        setIsEmailUnverified(true);
        setResendEmail(data.email);
        setLoginError(message);
      } else {
        setLoginError(message);
      }
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to resend verification email.");
      }
      setResendSuccess(true);
    } catch (err) {
      toast({
        title: "Could not resend email",
        description: err instanceof Error ? err.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GoogleSignInButton onSignIn={loginWithGoogle} />
      <AuthDivider label="or sign in with email" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {isEmailUnverified && loginError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={authStyles.alertWarning}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="font-medium leading-relaxed">{loginError}</span>
            </div>
            {resendSuccess ? (
              <div className={authStyles.alertSuccessInline}>
                <CheckCircle className="h-4 w-4 shrink-0" />
                Verification email sent! Check your inbox.
              </div>
            ) : (
              <Button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="h-9 w-full rounded-xl bg-amber-600 text-xs font-bold uppercase tracking-wide text-white transition-all hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {resendLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    Resend Verification Email
                  </span>
                )}
              </Button>
            )}
          </motion.div>
        )}

        {loginError && !isEmailUnverified && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={authStyles.alertError}
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{loginError}</span>
          </motion.div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className={authStyles.label}>
            Email Address
          </Label>
          <div className={authStyles.inputGroup}>
            <Mail className={`${authStyles.inputIcon} h-[18px] w-[18px]`} aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={authStyles.inputWithIcon}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className={authStyles.label}>
              Password
            </Label>
            <Link href="/forgot-password" className={authStyles.linkSmall}>
              Forgot it?
            </Link>
          </div>
          <div className={authStyles.inputGroup}>
            <Lock className={`${authStyles.inputIcon} h-[18px] w-[18px]`} aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={authStyles.inputWithIconToggle}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={authStyles.passwordToggle}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className={`${authStyles.buttonPrimary} mt-2`}>
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Authenticating...
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LogIn className="h-5 w-5" />
              Sign In
            </span>
          )}
        </Button>
      </form>

      <div className="border-t border-border/50 pt-5 text-center">
        <p className={authStyles.footerText}>
          New to The Chattala?{" "}
          <button type="button" onClick={onSwitch} className={authStyles.link}>
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
