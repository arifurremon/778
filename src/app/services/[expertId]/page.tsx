
"use client";

import { BookingModal } from "@/components/services/booking-modal";
import { realProviderToProvider } from "@/components/services/service-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlobalLoader } from "@/components/ui/global-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalUserBadges } from "@/components/user/global-user-badges";
import { useMessages } from "@/hooks/use-messages";
import { formatFeeBdt } from "@/lib/money/fee";
import type { Provider } from "@/types/index";
import {
    ArrowLeft,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    MapPin,
    MessageSquare,
    Phone,
    ShieldCheck,
    Star
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
type ExpertApiResponse = {
  id: string;
  profession: string;
  category: string;
  location: string;
  experienceYears: number;
  fee: number | null;
  bio: string | null;
  qualifications: string[] | null;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    preferredName: string | null;
    username: string | null;
    profileImage: string | null;
    isVerified: boolean;
    location?: string | null;
  };
};

function apiToProvider(data: ExpertApiResponse): Provider {
  return realProviderToProvider({
    ...data,
    fee: data.fee,
    qualifications: data.qualifications,
  });
}

export default function ExpertPublicProfile() {
  const { expertId } = useParams<{ expertId: string }>();
  const router = useRouter();
  const { startConversation } = useMessages();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [expert, setExpert] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!expertId) return;
    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);

    fetch(`/api/services/${expertId}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load expert");
        return res.json() as Promise<ExpertApiResponse>;
      })
      .then((data) => {
        if (!cancelled && data) setExpert(apiToProvider(data));
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [expertId]);

  const handleMessageExpert = () => {
    if (!expert) return;
    startConversation({
      id: expert.id,
      name: expert.name,
      avatar: expert.image ?? "",
      role: expert.profession,
      context: `Service Inquiry: ${expert.category}`,
    });
    router.push("/messages");
  };

  if (isLoading) {
    return <GlobalLoader />;
  }

  if (notFound || !expert) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
          <h1 className="text-2xl font-bold">Provider not found</h1>
          <p className="text-muted-foreground text-sm font-bold max-w-md text-center">
            This expert profile may have been removed or the link is incorrect.
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} className="mr-2" /> Go Back
          </Button>
        </div>
    );
  }

  const qualifications = expert.qualifications ?? [];

  return (
    <>
      <div className="min-h-screen pb-32">
        <div className="relative h-[300px] bg-gradient-to-br from-primary/20 via-background to-background">
          <div className="absolute top-8 left-8 md:left-12 z-10">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-background/40 backdrop-blur-xl border-border/50 hover:bg-background/80"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
            </Button>
          </div>

          <div className="absolute -bottom-16 left-8 md:left-16 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-[3rem] overflow-hidden border-8 border-background shadow-2xl ring-8 ring-accent/5 bg-background">
              <Image
                src={expert.image ?? "/city_background.png"}
                alt={expert.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-3 pb-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{expert.name}</h1>
                <GlobalUserBadges user={{ isVerified: true, isServiceProvider: true }} size={24} />
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-accent">
                  <Award size={16} /> {expert.profession}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" /> {expert.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star size={16} className="fill-accent text-accent" /> {expert.rating} ({expert.reviews} Reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-8 mt-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full max-w-md mb-8">
                <TabsTrigger value="about" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Biography</TabsTrigger>
                <TabsTrigger value="portfolio" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Portfolio</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-10 mt-0">
                <section className="space-y-4 text-left">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <FileText size={20} className="text-accent" /> About the Expert
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed font-bold">
                    {expert.bio}
                  </p>
                </section>

                <section className="space-y-4 text-left">
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                    <Award size={20} className="text-accent" /> Qualifications & Credentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {qualifications.map((q, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-card/20 border border-border/50 rounded-2xl">
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        <span className="text-sm font-bold">{q}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {expert.portfolio?.map((img, i) => (
                    <div key={i} className="relative aspect-video rounded-3xl overflow-hidden border border-border/50 group shadow-lg">
                      <Image src={img} alt="Work" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="outline" className="rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white font-bold text-xs uppercase tracking-widest h-10 px-6">View Project</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-0">
                <div className="bg-card/20 border border-border/50 rounded-[2.5rem] p-12 text-center space-y-4">
                  <Star size={48} className="text-accent/20 mx-auto" />
                  <h3 className="text-xl font-bold">Client Feedback Ecosystem</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto font-bold">Reviews for professional services are currently being migrated to the new unified verified system.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/30 border-border/60 rounded-[2.5rem] p-8 space-y-8 sticky top-28 shadow-xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Consultation Fee</span>
                  <span className="text-2xl font-black text-accent">{formatFeeBdt(expert.fee)}</span>
                </div>
                <div className="h-px bg-border/10" />
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <Clock size={16} className="text-primary" />
                    <span>Avg Response: <span className="text-foreground">2 Hours</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Verified by The Chattala Compliance</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setIsBookingOpen(true)}
                  className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 transition-all active:scale-95"
                >
                  <Calendar size={18} className="mr-2" /> Book Now
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMessageExpert}
                  className="w-full h-14 border-border/50 bg-background/20 hover:bg-white/5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px]"
                >
                  <MessageSquare size={18} className="mr-2" /> Message
                </Button>
              </div>

              <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-3">
                <Phone size={14} className="text-accent shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground font-bold leading-relaxed text-left">
                  Verified experts may request a phone verification before finalizing high-value bookings.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BookingModal
        provider={expert}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </>
  );
}
