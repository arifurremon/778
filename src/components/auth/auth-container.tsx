"use client";

import Logo from "@/components/brand/logo";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import LoginForm from "./login-form";
import SignupForm from "./signup-form";

export default function AuthContainer() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-20">
      {/* Modern 2026 Premium Glass Container */}
      <div className="relative overflow-hidden">
        {/* Professional glassmorphic background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-blue-50/90 to-white/95 rounded-3xl"></div>
        
        {/* Premium glass effect with enhanced blur */}
        <div className="relative backdrop-blur-3xl border border-white/70 shadow-2xl rounded-3xl px-8 py-10 lg:px-12 lg:py-12"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(240,245,255,0.95) 50%, rgba(255,255,255,0.97) 100%)',
            boxShadow: '0 20px 60px rgba(0,20,60,0.15), 0 0 1px rgba(255,255,255,0.5) inset',
          }}
        >
          {/* Refined decorative elements */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-300/15 to-indigo-300/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-200/10 to-cyan-200/8 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>
          
          {/* Logo */}
          <div className="relative flex justify-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Logo width={160} />
            </motion.div>
          </div>
          
          {/* Tab Navigation */}
          <div className="relative mb-10">
            <div className="flex gap-1 p-1.5 bg-gray-100/80 rounded-full w-fit mx-auto">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isLogin
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  !isLogin
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Form Container */}
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
