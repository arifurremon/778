"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Search, 
  Users, 
  ShoppingBag, 
  ShieldAlert,
  Briefcase,
  ArrowRight,
  Lightbulb,
  Send,
  Plus
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const FEATURES = [
  {
    title: "Local Directory",
    description: "Explore landmarks, institutions, and the rich heritage of Chittagong.",
    icon: <Search className="w-6 h-6" />,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/40",
    accent: "text-blue-500",
    href: "/directory"
  },
  {
    title: "Community Hub",
    description: "Join discussions, share updates, and connect with your neighbors.",
    icon: <Users className="w-6 h-6" />,
    color: "bg-indigo-500",
    shadow: "shadow-indigo-500/40",
    accent: "text-indigo-500",
    href: "/community"
  },
  {
    title: "Local Shops",
    description: "Support homegrown brands and buy essentials from verified vendors.",
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "bg-emerald-500",
    shadow: "shadow-emerald-500/40",
    accent: "text-emerald-500",
    href: "/shops"
  },
  {
    title: "Expert Services",
    description: "Book verified doctors, home tutors, and technical experts instantly.",
    icon: <Briefcase className="w-6 h-6" />,
    color: "bg-amber-500",
    shadow: "shadow-amber-500/40",
    accent: "text-amber-500",
    href: "/services"
  },
  {
    title: "Emergency Services",
    description: "Instant access to local police, fire stations, and medical response.",
    icon: <ShieldAlert className="w-6 h-6" />,
    color: "bg-rose-500",
    shadow: "shadow-rose-500/40",
    accent: "text-rose-500",
    href: "/emergency",
    important: true
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeatureGrid() {
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestTitle, setSuggestTitle] = useState("");
  const [suggestDetails, setSuggestDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.post("/api/suggestions", {
        title: suggestTitle.trim(),
        details: suggestDetails.trim() || undefined,
      });

      toast({
        title: "Suggestion Received",
        description: "Thank you for helping us shape the future of The Chattala.",
      });
      setSuggestTitle("");
      setSuggestDetails("");
      setIsSuggestModalOpen(false);
    } catch (err) {
      toast({
        title: "Submission Failed",
        description: err instanceof Error ? err.message : "Could not submit suggestion.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((feature) => (
          <Link key={feature.title} href={feature.href}>
            <motion.div
              variants={item}
              className="group relative bg-gradient-to-br from-card/80 to-card/30 border border-border/50 rounded-[2rem] p-8 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-accent/40 cursor-pointer overflow-hidden h-full flex flex-col"
            >
              {/* Decorative background glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 ${feature.color.replace('bg', 'bg')}`} />

              <div className="flex items-start justify-between mb-8 relative z-10">
                <div className={`p-4 rounded-2xl ${feature.color} text-white shadow-lg ${feature.shadow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  {feature.icon}
                </div>
              </div>

              <div className="relative z-10 flex-1">
                <h3 className="text-xl font-bold mb-3 tracking-tight text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
              
              <div className="mt-10 pt-6 border-t border-border/10 flex items-center justify-between relative z-10">
                <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] ${feature.accent}`}>
                  <span>Launch Module</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-2" />
                </div>
                {feature.important && (
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}
              </div>
            </motion.div>
          </Link>
        ))}

        {/* Shape The Chattala Card */}
        <motion.div
          variants={item}
          onClick={() => setIsSuggestModalOpen(true)}
          className="group relative bg-gradient-to-br from-card/80 to-card/30 border border-border/50 rounded-[2rem] p-8 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-cyan-500/40 cursor-pointer overflow-hidden h-full flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500 blur-[80px] opacity-10 pointer-events-none transition-opacity group-hover:opacity-20" />

          <div className="flex items-start justify-between mb-8 relative z-10">
            <div className="p-4 rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
              <Lightbulb size={24} />
            </div>
            <Plus className="w-5 h-5 text-cyan-500 opacity-0 group-hover:opacity-100 transition-all group-hover:rotate-90" />
          </div>

          <div className="relative z-10 flex-1">
            <h3 className="text-xl font-bold mb-3 tracking-tight text-foreground">Shape The Chattala</h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Tell us what features you want to see next. We build for the Chittagong community.
            </p>
          </div>
          
          <div className="mt-10 pt-6 border-t border-border/10 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-500">
              <span>Suggest Feature</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-2" />
            </div>
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          </div>
        </motion.div>
      </motion.div>

      <Dialog open={isSuggestModalOpen} onOpenChange={setIsSuggestModalOpen}>
        <DialogContent className="bg-background border-border sm:max-w-[450px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Lightbulb className="text-cyan-500" /> Shape The Future
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest">
              Contribute to our product roadmap
            </DialogDescription>
          </DialogHeader>

          <form id="suggest-feature-form" onSubmit={(e) => void handleSuggestSubmit(e)} className="py-4 space-y-4">
             <div className="space-y-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Module or Feature Title</Label>
               <Input 
                 placeholder="e.g. Local Event Calendar" 
                 value={suggestTitle}
                 onChange={e => setSuggestTitle(e.target.value)}
                 className="bg-card/20 border-border/50 h-12 focus:ring-accent font-bold rounded-xl"
                 required
               />
             </div>
             <div className="space-y-2">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detailed Advice / Reason</Label>
               <Textarea 
                 placeholder="Explain how this feature would benefit the residents of Chittagong..." 
                 value={suggestDetails}
                 onChange={e => setSuggestDetails(e.target.value)}
                 className="bg-card/20 border-border/50 min-h-[120px] focus:ring-accent resize-none p-4 font-bold rounded-xl"
               />
             </div>
             <p className="text-[10px] text-muted-foreground font-medium leading-relaxed rounded-xl bg-muted/30 border border-border/40 px-4 py-3">
               File attachments are not available yet. Include links or details in your description above.
             </p>
          </form>

          <DialogFooter className="gap-3">
             <Button variant="ghost" onClick={() => setIsSuggestModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
             <Button type="submit" form="suggest-feature-form" disabled={isSubmitting} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest px-8 shadow-lg shadow-cyan-500/20 h-12">
               Submit Suggestion <Send size={14} className="ml-2" />
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
