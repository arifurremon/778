// Fixed: 9 — Replaced window.location.href with router.push for client-side navigation.
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, LogIn, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
      setLoginError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="space-y-8">


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl bg-red-50/80 border border-red-200/50 p-4 text-sm text-red-700 backdrop-blur-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{loginError}</span>
          </motion.div>
        )}
        
        <div className="space-y-3">
          <Label htmlFor="email" className="text-sm font-bold text-slate-800 tracking-wide uppercase">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="h-13 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-bold text-slate-800 tracking-wide uppercase">Password</Label>
            <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline uppercase tracking-wider">
              Forgot it?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-13 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80 pr-12"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-13 mt-8 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-base shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed tracking-wide uppercase"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Authenticating...
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              Sign In
            </span>
          )}
        </Button>
      </form>



      <div className="pt-6 border-t border-gray-200/50 text-center">
        <p className="text-sm text-gray-600 font-medium">
          New to The Chattala?{" "}
          <button
            onClick={onSwitch}
            className="text-blue-600 font-bold hover:text-blue-700 transition-all hover:underline"
          >
            Create account
          </button>
        </p>
      </div>
    </div>
  );
}
