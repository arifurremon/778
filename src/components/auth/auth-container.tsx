"use client";

import Logo from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";

interface AuthContainerProps {
  defaultTab?: "login" | "register";
}

export default function AuthContainer({ defaultTab = "login" }: AuthContainerProps) {
  const [isLogin, setIsLogin] = useState(defaultTab === "login");

  return (
    <div className="w-full max-w-2xl mx-auto relative z-20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--auth-glass-from)/0.95)] via-[hsl(var(--auth-glass-via)/0.9)] to-[hsl(var(--auth-glass-from)/0.95)] rounded-3xl" />

        <div
          className={cn(
            "relative backdrop-blur-3xl border shadow-2xl rounded-3xl px-8 py-10 lg:px-12 lg:py-12",
            "border-[hsl(var(--auth-glass-border)/0.7)] dark:border-white/10",
            "bg-gradient-to-br from-[hsl(var(--auth-glass-from)/0.97)] via-[hsl(var(--auth-glass-via)/0.95)] to-[hsl(var(--auth-glass-from)/0.97)]",
            "dark:from-[hsl(var(--auth-glass-from)/0.92)] dark:via-[hsl(var(--auth-glass-via)/0.88)] dark:to-[hsl(var(--auth-glass-from)/0.92)]",
            "dark:shadow-black/40"
          )}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-auth-brand/15 to-accent/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-auth-brand/10 to-accent/8 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

          <div className="relative flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Logo width={160} />
            </motion.div>
          </div>

          <div className="relative mb-10">
            <div className="flex gap-1 p-1.5 bg-[hsl(var(--auth-glass-tab)/0.8)] dark:bg-muted/50 rounded-full w-fit mx-auto border border-border/30">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                  isLogin
                    ? "bg-card text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300",
                  !isLogin
                    ? "bg-card text-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Create Account
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <LoginForm onSwitch={() => setIsLogin(false)} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <SignupForm onSwitch={() => setIsLogin(true)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
