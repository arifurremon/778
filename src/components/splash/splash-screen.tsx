"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
}

const SPLASH_IMAGE = "https://res.cloudinary.com/dp5ap39r6/image/upload/v1777768898/p_svfnq8.png";

export default function SplashScreen({ isVisible }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.08,
            filter: "blur(24px)",
          }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
        >
          {/* Ambient radial glow behind the logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute w-[420px] h-[420px] rounded-full bg-accent/10 blur-[100px] pointer-events-none"
          />

          {/* Secondary smaller glow for depth */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[180px] h-[180px] rounded-full bg-primary/20 blur-[60px] pointer-events-none"
          />

          {/* Logo container */}
          <div className="relative flex flex-col items-center gap-10 z-10">
            {/* Main logo image with pulse animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              {/* Outer ring pulse */}
              <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-accent/20 blur-sm"
              />
              {/* Inner ring pulse (offset timing) */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-primary/15 blur-xs"
              />
              <Image
                src={SPLASH_IMAGE}
                alt="The Chattala"
                width={150}
                height={150}
                priority
                className="relative z-10 select-none drop-shadow-2xl"
              />
            </motion.div>

            {/* Animated horizontal rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.2, ease: "circInOut" }}
              className="h-px w-64 bg-gradient-to-r from-transparent via-accent/60 to-transparent origin-center"
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="text-accent/70 text-[10px] tracking-[0.55em] uppercase font-semibold"
            >
              Chittagong's Digital Hub
            </motion.p>
          </div>

          {/* Bottom loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-14 flex gap-2 items-center"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                className="w-1.5 h-1.5 rounded-full bg-accent"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
