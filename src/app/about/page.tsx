"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
    Building2,
    Compass,
    Facebook,
    FileText,
    Github,
    Handshake,
    History,
    Instagram,
    Lightbulb,
    Linkedin,
    Mail,
    Send,
    ShieldCheck
} from "lucide-react";
import { useState } from "react";
import Layout from "../dashboard/layout";

export default function VisionLegacyPage() {
  const [activeTab, setActiveTab] = useState("genesis");

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Our core team will get back to you shortly.",
    });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-10 px-6 space-y-12">
        {/* Page Header */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.2em] text-[10px]">
            <Compass size={12} /> The Legacy Framework
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Vision & <span className="text-accent">Legacy</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">
            Understanding the architecture of a Hyperlocal Digital Ecosystem
          </p>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="bg-card/20 border border-border/50 p-1 rounded-full w-full overflow-x-auto scrollbar-hide flex justify-start sm:justify-center">
            <TabsTrigger value="genesis" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Genesis</TabsTrigger>
            <TabsTrigger value="architect" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Architect</TabsTrigger>
            <TabsTrigger value="legal" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Legal</TabsTrigger>
            <TabsTrigger value="invest" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Future</TabsTrigger>
            <TabsTrigger value="contact" className="flex-1 rounded-full font-bold text-[10px] uppercase tracking-widest py-3">Inquiry</TabsTrigger>
          </TabsList>

          <TabsContent value="genesis" className="space-y-12 mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6 text-left">
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <History className="text-accent" /> The Genesis of Chattala
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    "The Chattala" was born from a singular realization: that the digital world, while global, often ignores the most vital part of human life—the neighborhood. 
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    We envisioned a platform that wasn't just another social network, but a high-fidelity **Hyperlocal Digital Ecosystem** designed specifically for the unique cultural and economic landscape of Chittagong.
                  </p>
                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2rem] space-y-4">
                     <h4 className="text-xs font-black uppercase tracking-widest text-accent">Our Core Vision</h4>
                     <ul className="space-y-3">
                       <li className="flex items-start gap-3 text-xs font-bold">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0" />
                         <span>Bridge the gap between verified local vendors and residents.</span>
                       </li>
                       <li className="flex items-start gap-3 text-xs font-bold">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0" />
                         <span>Provide instantaneous access to emergency response networks.</span>
                       </li>
                       <li className="flex items-start gap-3 text-xs font-bold">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0" />
                         <span>Preserve the heritage and history of the port city digitally.</span>
                       </li>
                     </ul>
                  </div>
                </div>
                <div className="relative aspect-square bg-card/20 rounded-[3rem] border border-border/50 overflow-hidden flex items-center justify-center group">
                   <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-primary/5 opacity-50" />
                   <Building2 size={120} className="text-accent/20 group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute bottom-10 left-10 right-10 p-6 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent mb-1">Current Milestone</p>
                      <p className="text-sm font-bold">Phase 1: Ecosystem Foundation v1.1</p>
                   </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="architect" className="space-y-12 mt-0">
             <div className="max-w-3xl mx-auto space-y-12">
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="relative">
                     <Avatar className="w-32 h-32 border-4 border-card ring-4 ring-primary/20 shadow-2xl">
                       <AvatarImage src="/city_background.png" />
                       <AvatarFallback className="text-4xl font-bold bg-primary/20 text-primary">AS</AvatarFallback>
                     </Avatar>
                     <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground p-2 rounded-xl shadow-lg border-2 border-background">
                       <ShieldCheck size={20} />
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <h2 className="text-3xl font-bold tracking-tight uppercase">ABU MD. SELIM</h2>
                     <p className="text-accent font-bold text-sm uppercase tracking-widest">Architect & Lead Developer</p>
                   </div>

                   <p className="text-sm text-muted-foreground leading-relaxed font-bold max-w-2xl">
                     Abu Md. Selim is a senior Computer Science Engineer and the visionary architect behind the high-fidelity infrastructure of The Chattala. As the Founder & CTO of Inievo Technologies, he directs the technical strategy and execution of this hyperlocal ecosystem, merging rigorous engineering standards with the profound philosophical insights of thinkers like Franz Kafka and Plato. Selim leads the project with a commitment to translating the complex existential requirements of urban life into precise, efficient code, establishing a robust digital legacy for the city of Chittagong.
                   </p>
                   <p className="text-xs text-muted-foreground/60 px-10 font-bold uppercase tracking-widest">
                     "The Chattala is an attempt to map the existential needs of a city onto the precision of code."
                   </p>

                   <div className="flex flex-wrap justify-center gap-4 pt-6">
                      <SocialLink icon={<Linkedin size={18} />} label="LinkedIn" href="https://linkedin.com/in/selimabumd" />
                      <SocialLink icon={<Facebook size={18} />} label="Facebook" href="https://facebook.com/aabumdselim" />
                      <SocialLink icon={<Instagram size={18} />} label="Instagram" href="https://instagram.com/mishuabcde" />
                      <SocialLink icon={<Github size={18} />} label="GitHub" href="https://github.com/abumdselim" />
                      <SocialLink icon={<Mail size={18} />} label="Email" href="mailto:selimabumd@gmail.com" />
                   </div>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="legal" className="space-y-8 mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <LegalCard title="Privacy Policy">
                  <div className="space-y-4">
                    <p>1. **Data Sovereignty**: We believe user data belongs to the resident. We do not sell personally identifiable information.</p>
                    <p>2. **Location Accuracy**: Precision location is used only for hyperlocal matching within Chittagong Thanas.</p>
                    <p>3. **Security**: We utilize enterprise-grade encryption to protect communication between residents and merchants.</p>
                    <p>4. **Cookies**: Session-based cookies are used to maintain your premium preferences and login state.</p>
                  </div>
                </LegalCard>
                <LegalCard title="Terms of Use">
                   <div className="space-y-4">
                    <p>1. **Authenticity**: Users must provide accurate information. Fraudulent merchant accounts are permanently banned.</p>
                    <p>2. **Community Conduct**: We maintain a professional environment. Harassment or misinformation is strictly prohibited.</p>
                    <p>3. **Service Fulfillment**: Merchants and experts are responsible for the quality of services delivered via the platform.</p>
                    <p>4. **Updates**: The Chattala reserves the right to modify the legacy architecture to improve ecosystem health.</p>
                  </div>
                </LegalCard>
             </div>
          </TabsContent>

          <TabsContent value="invest" className="space-y-12 mt-0">
             <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-[3rem] p-10 text-center space-y-8">
                <div className="w-20 h-20 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-primary/20">
                   <Handshake size={40} />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight">The Future is Hyperlocal</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed font-bold max-w-2xl mx-auto">
                    The Chattala is scaling to become the unified operating system for Chittagong's digital economy. We are currently open to strategic partnerships, institutional investment, and technical collaborations.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left pt-6">
                   <FeatureBox icon={<Lightbulb className="text-amber-500" />} title="Work with Us" desc="Join our technical or community moderation team." />
                   <FeatureBox icon={<Handshake className="text-accent" />} title="Collaborate" desc="Integrate your local service or business with our API." />
                   <FeatureBox icon={<Building2 className="text-emerald-500" />} title="Invest" desc="Strategic seed rounds for ecosystem expansion." />
                </div>
             </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-0">
             <div className="max-w-2xl mx-auto">
                <Card className="bg-card/20 border-border/50 rounded-[2.5rem] p-10">
                   <form onSubmit={handleContactSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2 text-left">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Your Name</Label>
                          <Input className="bg-background/40 border-border/50 h-12 rounded-xl font-bold" required />
                        </div>
                        <div className="space-y-2 text-left">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Email Address</Label>
                          <Input type="email" className="bg-background/40 border-border/50 h-12 rounded-xl font-bold" required />
                        </div>
                      </div>
                      <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Inquiry Subject</Label>
                        <Input className="bg-background/40 border-border/50 h-12 rounded-xl font-bold" required />
                      </div>
                      <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Message</Label>
                        <Textarea className="bg-background/40 border-border/50 min-h-[150px] rounded-2xl p-4 font-bold resize-none" required />
                      </div>
                      <Button className="w-full bg-accent text-accent-foreground font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]">
                        Send Inquiry <Send size={16} className="ml-2" />
                      </Button>
                   </form>
                </Card>
             </div>
          </TabsContent>
        </Tabs>

        {/* Vision Footer */}
        <footer className="pt-20 pb-10 text-center space-y-2 border-t border-border/10">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">The Chattala Version 1.1</p>
           <p className="text-[11px] font-black uppercase tracking-[0.4em] text-accent">Developed with Love and Passion by ABU MD. SELIM</p>
        </footer>

        <div className="h-20" />
      </div>
    </Layout>
  );
}

function SocialLink({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Button variant="outline" className="bg-card/30 border-border/50 hover:bg-accent/10 hover:border-accent/40 rounded-xl px-4 flex items-center gap-2 font-bold text-xs">
        {icon} <span>{label}</span>
      </Button>
    </a>
  );
}

function LegalCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <Card className="bg-card/20 border-border/50 rounded-[2rem] p-8 text-left space-y-6">
       <div className="flex items-center gap-3 text-accent border-b border-border/10 pb-4">
         <FileText size={20} />
         <h3 className="text-lg font-bold tracking-tight">{title}</h3>
       </div>
       <div className="text-[13px] text-muted-foreground leading-relaxed font-bold space-y-4">
         {children}
       </div>
    </Card>
  );
}

function FeatureBox({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-background/40 backdrop-blur-md border border-border/30 rounded-3xl p-6 space-y-2 hover:border-accent/40 transition-colors">
       <div className="mb-3">{icon}</div>
       <h4 className="text-sm font-black uppercase tracking-widest">{title}</h4>
       <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">{desc}</p>
    </div>
  );
}
