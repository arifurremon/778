"use client";

import { motion } from "framer-motion";
import { Search, ChevronRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureGrid } from "@/components/dashboard/feature-grid";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export default function OverviewPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-10 space-y-12">
      {/* Premium Hero Section */}
      <section className="mb-12 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.3em] text-[10px] mb-3">
            <span className="w-8 h-[1px] bg-accent/40" /> THE ULTIMATE HUB
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
            Your Digital Gateway to <span className="text-accent">Chittagong.</span>
          </h1>
          <p className="text-base md:text-lg font-bold text-muted-foreground max-w-2xl leading-relaxed mt-4">
            The all-in-one hyper-local ecosystem connecting you to neighborhood services, 
            verified shops, and community updates. Built for the residents of the Port City.
          </p>
        </motion.div>
      </section>
      
      {/* Vibrant Bento Feature Grid */}
      <FeatureGrid />

      {/* Discovery Section */}
      <motion.div
         initial={{ opacity: 0, y: 30 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ duration: 0.8 }}
         className="relative min-h-[320px] border border-border/50 bg-gradient-to-br from-card/40 to-background rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center p-8 md:p-16 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--accent),0.05),transparent)] pointer-events-none" />
        
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-[2rem] bg-accent text-white flex items-center justify-center shadow-2xl shadow-accent/40 rotate-3 transition-transform hover:rotate-0 duration-500">
            <Search size={36} />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-background flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">Looking for something specific?</h2>
        <p className="max-w-lg text-muted-foreground text-sm leading-relaxed font-bold">
          Our universal search scans across verified shops, local professionals, and community discussions to find exactly what you need in Chattala.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/shops">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-10 h-14 shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-105 font-bold uppercase text-[11px] tracking-[0.2em] w-full sm:w-auto">
              Explore Shops 
              <ArrowUpRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="outline" className="border-border/50 bg-card/10 backdrop-blur-md hover:bg-white/5 rounded-2xl px-10 h-14 font-bold uppercase text-[11px] tracking-[0.2em] transition-all hover:scale-105 w-full sm:w-auto">
              Find Professionals
            </Button>
          </Link>
        </div>
      </motion.div>
      
      <div className="h-10" />
    </div>
  );
}
