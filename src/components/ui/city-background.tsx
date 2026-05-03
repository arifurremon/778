
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function CityBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div
        initial={{ x: "-5%", y: "-2%", scale: 1.1 }}
        animate={{ 
          x: ["-5%", "5%", "-5%"],
          y: ["-2%", "2%", "-2%"],
        }}
        transition={{
          duration: 60,
          ease: "linear",
          repeat: Infinity,
        }}
        className="relative w-[110%] h-[110%] opacity-[0.05] dark:opacity-[0.08]"
      >
        <Image
          src="/city_background.png"
          alt="City Sketch Overlay"
          fill
          className="object-contain dark:invert select-none"
          priority
        />
      </motion.div>
    </div>
  );
}
