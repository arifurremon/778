"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface SplashScreenProps {
  isVisible: boolean;
}

const CHATTALA_LOGO = "/logo-full.png";

export default function SplashScreen({ isVisible }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
        >
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
              className="select-none object-contain max-w-[80vw] max-h-[80vh]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
