"use client";

import AuthBrandPanel from "@/components/auth/auth-brand-panel";
import { authStyles } from "@/lib/design/auth-styles";
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
    <div className={authStyles.cardShell}>
      <div className={authStyles.cardGrid}>
        <AuthBrandPanel />

        <div className={authStyles.formPanel}>
          <div className={authStyles.formPanelGlow} />

          <div className="relative z-10 flex h-full flex-col">
            <header className={authStyles.formHeader}>
              <h1 className={authStyles.formTitle}>
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className={authStyles.formSubtitle}>
                {isLogin
                  ? "Sign in to access your neighbourhood community."
                  : "Join The Chattala and connect with your local area."}
              </p>
            </header>

            <div className="mb-6 lg:mb-8">
              <div className={authStyles.tabGroup} role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  onClick={() => setIsLogin(true)}
                  className={cn(
                    authStyles.tabButton,
                    isLogin ? authStyles.tabActive : authStyles.tabInactive
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  onClick={() => setIsLogin(false)}
                  className={cn(
                    authStyles.tabButton,
                    !isLogin ? authStyles.tabActive : authStyles.tabInactive
                  )}
                >
                  Create Account
                </button>
              </div>
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                  >
                    <LoginForm onSwitch={() => setIsLogin(false)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                  >
                    <SignupForm onSwitch={() => setIsLogin(true)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
