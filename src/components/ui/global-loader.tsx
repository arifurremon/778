"use client";

import { motion } from "framer-motion";

export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <div className="relative flex items-center justify-center w-28 h-28">
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-primary/30"
          style={{ borderTopColor: "hsl(var(--primary))", borderRightColor: "transparent" }}
        />
        
        {/* Inner reverse ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-emerald-500/30"
          style={{ borderBottomColor: "#10b981", borderLeftColor: "transparent" }}
        />

        {/* Center Logo pulsing */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative w-12 h-12 drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]"
        >
          <img 
            src="/logo-icon.png?v=2" 
            alt="The Chattala Logo" 
            className="w-full h-full object-contain" 
          />
        </motion.div>
      </div>

      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <p className="text-xs font-bold tracking-[0.2em] text-foreground/80 uppercase">
          The Chattala
        </p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
              className="w-1 h-1 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
