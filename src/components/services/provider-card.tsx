
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Calendar, Zap, MessageSquare, Clock, Award, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { BookingModal } from "./booking-modal";
import Link from "next/link";

interface ProviderCardProps {
  provider: any;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-[2.5rem] p-6 hover:bg-card/40 hover:border-accent/30 transition-smooth group relative overflow-hidden h-full flex flex-col shadow-sm">
        {/* Glow Effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <Link href={`/services/${provider.id}`}>
          <div className="flex items-start gap-5 mb-6 cursor-pointer">
            <Avatar className="w-16 h-16 border-2 border-background ring-2 ring-accent/10 shadow-xl group-hover:scale-105 transition-transform duration-500">
              <AvatarImage src={provider.image} />
              <AvatarFallback className="font-bold">{provider.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1 text-left">
              <h4 className="text-lg font-bold tracking-tight text-foreground group-hover:text-accent transition-colors leading-tight">
                {provider.name}
              </h4>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                {provider.profession}
              </p>
              <div className="flex items-center gap-3 pt-1">
                 <div className="flex items-center text-accent font-bold text-[10px] bg-accent/10 px-2 py-0.5 rounded-full border border-accent/10">
                  <Star size={10} className="fill-accent mr-1" /> {provider.rating}
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest">
                  {provider.reviews} Reviews
                </span>
              </div>
            </div>
          </div>
        </Link>

        <div className="space-y-3 mb-8 flex-1 text-left">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
            <MapPin size={14} className="text-primary" />
            <span>{provider.location}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
            <Award size={14} className="text-primary" />
            <span>{(provider as any).experience}+ Years Experience</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
            {provider.type === 'appointment' ? <Clock size={14} className="text-primary" /> : <Zap size={14} className="text-primary" />}
            <span>Consultation: <span className="text-accent">{provider.fee}</span></span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setIsModalOpen(true)}
            className={`flex-[2] rounded-xl font-bold text-[10px] uppercase tracking-[0.15em] h-11 shadow-lg transition-smooth ${
              provider.type === 'appointment' 
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20' 
              : 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/20'
            }`}
          >
            {provider.type === 'appointment' ? 'Book Appointment' : 'Request Service'}
          </Button>
          <Link href={`/services/${provider.id}`} className="flex-1">
            <Button variant="outline" className="w-full rounded-xl border-border/50 hover:bg-white/5 h-11 p-0">
               <ChevronRight size={18} />
            </Button>
          </Link>
        </div>
      </div>

      <BookingModal 
        provider={provider} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
