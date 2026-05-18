
"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { CHITTAGONG_AREAS, MOCK_PROVIDERS } from "@/lib/mock-data";
import { AnimatePresence, motion } from "framer-motion";
import {
    AirVent,
    BookOpen,
    Code,
    Droplets,
    Filter,
    HardHat,
    MapPin,
    Scissors,
    Search,
    Stethoscope,
    Wrench,
    Zap
} from "lucide-react";
import { useMemo, useState } from "react";
import { ProviderCard } from "./provider-card";

export type ServiceCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

const CATEGORIES: ServiceCategory[] = [
  { id: 'doctors', name: 'Doctors', icon: <Stethoscope size={18} /> },
  { id: 'appliances', name: 'Home Appliances', icon: <AirVent size={18} /> },
  { id: 'tutors', name: 'Tutors', icon: <BookOpen size={18} /> },
  { id: 'tech', name: 'Web/Tech', icon: <Code size={18} /> },
  { id: 'engineers', name: 'Engineers', icon: <HardHat size={18} /> },
  { id: 'electricians', name: 'Electricians', icon: <Zap size={18} /> },
  { id: 'plumbers', name: 'Plumbers', icon: <Droplets size={18} /> },
  { id: 'mechanics', name: 'Mechanics', icon: <Wrench size={18} /> },
  { id: 'beauty', name: 'Beauty/Salon', icon: <Scissors size={18} /> },
];

export default function ServiceView() {
  const [activeCategory, setActiveCategory] = useState('doctors');
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Advanced Filters
  const [filterThana, setFilterThana] = useState("All Areas");
  const [filterExp, setFilterExp] = useState([0, 30]);

  const filteredProviders = useMemo(() => {
    return MOCK_PROVIDERS.filter(provider => {
      const matchesCategory = provider.category === activeCategory;
      const matchesText = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          provider.profession.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesThana = filterThana === "All Areas" || provider.location === filterThana;
      const matchesExp = provider.experience >= filterExp[0] && provider.experience <= filterExp[1];
      
      return matchesCategory && matchesText && matchesThana && matchesExp;
    });
  }, [activeCategory, searchQuery, filterThana, filterExp]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
             <MapPin size={12} /> Expert Directory
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Professional <span className="text-accent">Services</span>
          </h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">
            Book verified experts, tutors, and technical professionals instantly
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by name or skill..." 
              className="pl-10 bg-card/20 border-border/50 h-11 focus:ring-accent rounded-xl font-bold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 w-11 rounded-xl border-border/50 bg-card/20 p-0">
                <Filter size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-background border-border rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Service Filters</DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location (Thana)</Label>
                  <Select value={filterThana} onValueChange={setFilterThana}>
                    <SelectTrigger className="h-11 bg-card/20 border-border/50 rounded-xl font-bold">
                      <SelectValue placeholder="Select Area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Areas">All Areas</SelectItem>
                      {CHITTAGONG_AREAS.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Experience (Years)</Label>
                    <span className="text-xs font-bold text-accent">{filterExp[0]} - {filterExp[1]}+ Years</span>
                  </div>
                  <Slider 
                    defaultValue={[0, 30]} 
                    max={30} 
                    step={1}
                    value={filterExp}
                    onValueChange={setFilterExp}
                    className="py-4"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase text-[10px] tracking-widest" onClick={() => {setFilterThana('All Areas'); setFilterExp([0,30]);}}>Reset</Button>
                <Button className="flex-[2] bg-accent text-accent-foreground rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg h-11" onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="relative group">
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide snap-x snap-mandatory">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest whitespace-nowrap border transition-smooth snap-start ${
                activeCategory === cat.id 
                ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105' 
                : 'bg-card/20 border-border/50 text-muted-foreground hover:border-accent/40 hover:text-foreground'
              }`}
            >
              <span className={activeCategory === cat.id ? 'text-white' : 'text-accent'}>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredProviders.map((provider, idx) => (
            <motion.div
              key={provider.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <ProviderCard provider={provider} />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {filteredProviders.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-border/30 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="text-xl font-bold">No experts found</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto leading-relaxed font-bold">
            No matching professionals in <span className="text-accent font-bold">{filterThana === 'All Areas' ? 'Chittagong' : filterThana}</span>.
          </p>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
