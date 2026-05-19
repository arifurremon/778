"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
}

const CHATTALA_LOGO = "https://res.cloudinary.com/det1qnlrh/image/upload/v1779150538/LOGOICON_chfprq.png";
const INIEVO_LOGO = "https://res.cloudinary.com/det1qnlrh/image/upload/v1779150582/Inievo_skotl6.png";

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
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 overflow-hidden"
        >
          {/* Ambient radial glow behind the logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute w-[420px] h-[420px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/20 blur-[100px] pointer-events-none"
          />

          {/* Secondary smaller glow for depth */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.3, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[180px] h-[180px] rounded-full bg-gradient-to-tr from-blue-300/30 to-purple-300/20 blur-[60px] pointer-events-none"
          />

          {/* Logo container */}
          <div className="relative flex flex-col items-center gap-12 z-10">
            {/* Main logo with responsive bounce animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 40 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: [0, -12, 0]
              }}
              transition={{ 
                opacity: { duration: 0.8, ease: "easeOut" },
                scale: { duration: 0.8, ease: "easeOut" },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative"
            >
              {/* Outer ring pulse */}
              <motion.div
                animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-blue-400/20 blur-sm"
              />
              {/* Inner ring pulse (offset timing) */}
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-blue-500/15 blur-xs"
              />
              <Image
                src={CHATTALA_LOGO}
                alt="The Chattala"
                width={200}
                height={200}
                priority
                className="relative z-10 select-none drop-shadow-2xl"
              />
            </motion.div>

            {/* Animated horizontal rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.2, ease: "circInOut" }}
              className="h-px w-48 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent origin-center"
            />

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="text-gray-600 text-sm tracking-widest uppercase font-semibold"
            >
              Premium Digital Platform
            </motion.p>
          </div>

          {/* Bottom initiative section with Inievo logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-12 flex flex-col items-center gap-3"
          >
            <p className="text-xs text-gray-600/80 font-medium tracking-wide">
              An initiative by
            </p>
            <Image
              src={INIEVO_LOGO}
              alt="Inievo"
              width={120}
              height={40}
              priority
              className="select-none drop-shadow-sm"
            />
          </motion.div>

          {/* Bottom loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-3 flex gap-2 items-center"
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
                className="w-1.5 h-1.5 rounded-full bg-blue-500"
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
