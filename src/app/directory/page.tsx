"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  MapPin, 
  Map, 
  History, 
  Bus, 
  Newspaper, 
  Search, 
  ArrowRight, 
  ExternalLink,
  Info,
  Clock,
  Ticket,
  User as UserIcon,
  Landmark
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TOURISM_SPOTS, 
  HERITAGE_PEOPLE, 
  BUS_ROUTES, 
  NEWS_OUTLETS,
  type TourismSpot,
  type HeritagePerson,
  type BusRoute,
  type NewsOutlet,
} from "@/lib/directory-data";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { PageHeader } from "@/components/ui/page-header";
import { motion, AnimatePresence } from "framer-motion";

export default function DirectoryPage() {
  const [activeTab, setActiveTab] = useState("tourism");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [tourismSpots, setTourismSpots] = useState<TourismSpot[]>(TOURISM_SPOTS);
  const [heritagePeople, setHeritagePeople] = useState<HeritagePerson[]>(HERITAGE_PEOPLE);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>(BUS_ROUTES);
  const [newsOutlets, setNewsOutlets] = useState<NewsOutlet[]>(NEWS_OUTLETS);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ type: activeTab });
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    api.get<{ entries: unknown[] }>(`/api/directory?${params.toString()}`)
      .then((response) => {
        switch (activeTab) {
          case "tourism":
            setTourismSpots(response.entries as TourismSpot[]);
            break;
          case "heritage":
            setHeritagePeople(response.entries as HeritagePerson[]);
            break;
          case "transport":
            setBusRoutes(response.entries as BusRoute[]);
            break;
          case "news":
            setNewsOutlets(response.entries as NewsOutlet[]);
            break;
        }
      })
      .catch(() => {
        // Keep static fallback data if API is unavailable.
      })
      .finally(() => setIsLoading(false));
  }, [activeTab, searchQuery]);

  const filteredTourism = useMemo(() => tourismSpots.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery, tourismSpots]);

  const filteredHeritage = useMemo(() => heritagePeople.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery, heritagePeople]);

  const filteredBuses = useMemo(() => busRoutes.filter(b => 
    b.number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.origin.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.route.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [searchQuery, busRoutes]);

  return (
      <div className="max-w-6xl mx-auto py-8 px-6 space-y-8">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <PageHeader
            eyebrow="The Smart Guide"
            eyebrowIcon={MapPin}
            title={
              <>
                Chattala <span className="text-accent">Directory</span>
              </>
            }
            subtitle="Your gateway to Chittagong's history, spots, and life"
            subtitleClassName="text-[10px] font-bold uppercase tracking-widest opacity-60"
          />

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder={`Search in ${activeTab}...`} 
              className="pl-10 bg-card/20 border-border/50 h-11 focus:ring-accent rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        <Tabs defaultValue="tourism" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full max-w-2xl mx-auto">
            <TabsTrigger value="tourism" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Map size={14} className="mr-2 hidden sm:block" /> Spots
            </TabsTrigger>
            <TabsTrigger value="heritage" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Landmark size={14} className="mr-2 hidden sm:block" /> Heritage
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Bus size={14} className="mr-2 hidden sm:block" /> Transport
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <Newspaper size={14} className="mr-2 hidden sm:block" /> News
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="tourism" className="mt-0">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-72 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredTourism.map((spot) => (
                    <Card key={spot.id} className="bg-card/20 border-border/50 rounded-2xl overflow-hidden group hover:border-accent/30 transition-smooth flex flex-col">
                      <div className="relative h-44">
                        <Image src={spot.image} alt={spot.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-accent border border-accent/20 text-[8px] uppercase tracking-tighter">
                          {spot.category}
                        </Badge>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h4 className="font-bold text-base mb-1 tracking-tight group-hover:text-accent transition-colors">{spot.name}</h4>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-3">
                          <MapPin size={10} className="text-primary" /> {spot.location}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed mb-4 font-medium">
                          {spot.description}
                        </p>
                        <div className="mt-auto pt-4 border-t border-border/10 grid grid-cols-2 gap-2">
                           <div className="space-y-0.5">
                             <p className="text-[8px] font-bold uppercase text-muted-foreground">Timing</p>
                             <p className="text-[9px] font-bold flex items-center gap-1"><Clock size={8} /> {spot.timing}</p>
                           </div>
                           <div className="space-y-0.5">
                             <p className="text-[8px] font-bold uppercase text-muted-foreground">Entry</p>
                             <p className="text-[9px] font-bold flex items-center gap-1"><Ticket size={8} /> {spot.entryFee}</p>
                           </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                )}
              </TabsContent>

              <TabsContent value="heritage" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <History size={20} className="text-accent" /> Legends of Chattagram
                    </h3>
                    <div className="space-y-4">
                      {filteredHeritage.map((person) => (
                        <div key={person.id} className="bg-card/20 border border-border/50 rounded-3xl p-6 flex gap-6 hover:bg-card/30 transition-smooth">
                           <div className="relative w-24 h-32 rounded-xl overflow-hidden shrink-0 border border-border/50">
                             <Image src={person.image} alt={person.name} fill className="object-cover" />
                           </div>
                           <div className="space-y-2">
                             <div>
                               <h4 className="text-base font-black">{person.name}</h4>
                               <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{person.role}</p>
                             </div>
                             <Badge variant="outline" className="text-[8px] border-primary/20 text-primary font-bold">{person.lifespan}</Badge>
                             <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                               {person.bio}
                             </p>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                       <Info size={20} className="text-accent" /> History of the City
                    </h3>
                    <Card className="bg-primary/5 border-primary/20 p-8 rounded-3xl space-y-4">
                      <p className="text-sm leading-relaxed text-muted-foreground font-medium first-letter:text-4xl first-letter:font-black first-letter:mr-2 first-letter:text-accent first-letter:float-left">
                        Chittagong has a history that dates back for thousands of years. It was mentioned in Ptolemy's world map in the 2nd century. The port city was known to ancient Greek and Roman sailors as "Shetgang".
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                        In the 14th century, the city became a major center for Islamic culture and trade. It was famously visited by Ibn Battuta in 1345, who described it as a great port.
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                        The 1930 Armoury Raid led by Surya Sen is one of the most legendary events in the history of the Indian independence movement, proving Chittagong as a land of revolutionaries.
                      </p>
                      <Button variant="outline" className="w-full rounded-xl border-border/50 text-[10px] uppercase font-bold tracking-widest h-11">
                        Read Full History <ArrowRight size={14} className="ml-2" />
                      </Button>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transport" className="mt-0 space-y-6">
                <div className="bg-card/10 border border-border/50 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-border/50 bg-background/20">
                    <h3 className="text-base font-bold tracking-tight">City Bus Routes</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">Verified local transport network</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-muted/30 border-b border-border/50">
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Route No</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Origin</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Destination</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Full Route</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBuses.map((bus) => (
                          <tr key={bus.id} className="border-b border-border/20 hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                              <Badge className="bg-accent text-accent-foreground font-black text-xs px-3 py-1">
                                {bus.number}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold">{bus.origin}</td>
                            <td className="px-6 py-4 text-xs font-bold">{bus.destination}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {bus.route.map((stop, i) => (
                                  <div key={i} className="flex items-center">
                                    <span className="text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded border border-border/30 font-bold">{stop}</span>
                                    {i < bus.route.length - 1 && <ArrowRight size={10} className="mx-1 text-muted-foreground/30" />}
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="news" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {newsOutlets.map((news) => (
                    <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-card/20 border border-border/50 rounded-3xl p-8 hover:border-accent/40 hover:bg-card/40 transition-smooth text-center group h-full flex flex-col justify-center items-center gap-6">
                        <div className="relative w-40 h-20 grayscale group-hover:grayscale-0 transition-all duration-700">
                           <Image src={news.logo} alt={news.name} fill className="object-contain" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold tracking-tight">{news.name}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">{news.description}</p>
                        </div>
                        <Button variant="outline" className="rounded-full border-border/50 text-[10px] uppercase font-bold tracking-widest h-10 px-8 group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent">
                           Read Now <ExternalLink size={12} className="ml-2" />
                        </Button>
                      </Card>
                    </a>
                  ))}
                </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
        
        <div className="mt-16 text-center py-10 bg-accent/5 border border-accent/20 rounded-3xl">
           <h3 className="text-sm font-bold mb-2">Can't find a specific monument or route?</h3>
           <p className="text-xs text-muted-foreground mb-6 font-bold">Our directory is updated by the community daily. Search specifically in the header.</p>
           <Button variant="link" className="text-accent text-xs font-bold uppercase tracking-widest">
             Contribute Information
           </Button>
        </div>

        <div className="h-20" />
      </div>
  );
}
