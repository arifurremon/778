"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
}

const CHATTALA_LOGO = "https://res.cloudinary.com/det1qnlrh/image/upload/v1779171235/NEW_af42tm.png";
const INIEVO_LOGO = "https://res.cloudinary.com/det1qnlrh/image/upload/v1779150582/Inievo_skotl6.png";

export default function SplashScreen({ isVisible }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white relative"
        >
          {/* Main Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={CHATTALA_LOGO}
              alt="The Chattala"
              width={180}
              height={180}
              priority
              className="select-none"
            />
          </motion.div>

          {/* Inievo Initiative Logo Footer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute bottom-10 flex flex-col items-center gap-1.5"
          >
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-[0.2em]">
              An Initiative By
            </span>
            <Image
              src={INIEVO_LOGO}
              alt="Inievo Technologies"
              width={70}
              height={22}
              className="object-contain select-none opacity-90"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
