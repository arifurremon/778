"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MapPin, ShieldAlert, Siren, Truck, Building2, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EMERGENCY_CONTACTS, EmergencyCategory } from "@/lib/emergency-data";

const CATEGORIES = [
  { id: 'All', label: 'All Contacts', icon: <Search size={14} /> },
  { id: 'Police', label: 'Police', icon: <Siren size={14} /> },
  { id: 'Fire', label: 'Fire Service', icon: <Truck size={14} /> },
  { id: 'Ambulance', label: 'Ambulance', icon: <ShieldAlert size={14} /> },
  { id: 'Govt', label: 'Govt Offices', icon: <Building2 size={14} /> },
];

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = EMERGENCY_CONTACTS.filter(contact => {
    const matchesTab = activeTab === 'All' || contact.category === activeTab;
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contact.phone.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const getGoogleMapsUrl = (name: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' Chittagong')}`;
  };

  return (
      <div className="max-w-5xl mx-auto py-8 px-6 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive font-bold uppercase tracking-[0.2em] text-[10px]">
              <ShieldAlert size={12} className="animate-pulse" /> Emergency Response Network
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Essential <span className="text-accent">Contacts</span>
            </h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">
              Verified local services for Chittagong Division
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by station or service..." 
              className="pl-10 bg-card/20 border-border/50 h-11 focus:ring-destructive rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <section className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border transition-smooth ${
                  activeTab === cat.id 
                  ? (cat.id === 'Police' || cat.id === 'Fire' ? 'bg-destructive border-destructive text-white shadow-lg shadow-destructive/20' : 'bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/20')
                  : 'bg-card/20 border-border/50 text-muted-foreground hover:border-accent/50 hover:text-foreground'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact, idx) => (
              <motion.div
                key={contact.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 group hover:border-accent/30 transition-smooth relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-10 pointer-events-none ${
                  contact.category === 'Police' || contact.category === 'Fire' ? 'bg-destructive' : 'bg-accent'
                }`} />

                <div className="flex justify-between items-start mb-4">
                  <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-tighter ${
                    contact.category === 'Police' || contact.category === 'Fire' ? 'border-destructive/30 text-destructive' : 'border-accent/30 text-accent'
                  }`}>
                    {contact.category}
                  </Badge>
                </div>

                <h3 className="text-base font-bold tracking-tight mb-1 group-hover:text-accent transition-colors">
                  {contact.name}
                </h3>
                
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-6 font-bold">
                  <MapPin size={10} className="text-primary" /> {contact.address}
                </p>

                <div className="flex flex-col gap-2">
                  <Button 
                    asChild
                    className={`w-full rounded-xl h-11 font-bold text-xs uppercase tracking-widest transition-smooth shadow-lg ${
                      contact.category === 'Police' || contact.category === 'Fire' 
                      ? 'bg-destructive hover:bg-destructive/90 text-white shadow-destructive/20' 
                      : 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/20'
                    }`}
                  >
                    <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}>
                      <Phone size={14} className="mr-2" /> {contact.phone}
                    </a>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    asChild
                    className="w-full rounded-xl h-10 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-accent hover:bg-accent/5 transition-smooth"
                  >
                    <a href={getGoogleMapsUrl(contact.name)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={12} className="mr-2" /> View on Map
                    </a>
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        {filteredContacts.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-border/30 rounded-3xl">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold">No contacts found</h3>
            <p className="text-muted-foreground text-sm mt-1 font-bold">Try adjusting your search query.</p>
          </div>
        )}
        
        <div className="h-20" />
      </div>
  );
}
