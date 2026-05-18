
"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, CheckCircle2, Clock, MapPin } from "lucide-react";

import { Provider } from "@/types/index";

interface BookingModalProps {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ provider, isOpen, onClose }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock processing
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep(3);
  };

  const resetModal = () => {
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="sm:max-w-[450px] bg-background border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold italic tracking-tight flex items-center gap-2">
            {provider.type === 'appointment' ? 'Schedule Visit' : 'Service Request'}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest font-bold text-accent/60">
            Expert: {provider.name}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-4 pt-4">
            {provider.type === 'on-demand' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MapPin size={12} className="text-primary" /> Service Address
                  </Label>
                  <Input 
                    placeholder="E.g. House 24, Road 5, Block B, Halishahar" 
                    required 
                    className="bg-card/20 border-border/50 h-11 focus:ring-accent"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    Describe the issue
                  </Label>
                  <Textarea 
                    placeholder="Explain what needs fixing..." 
                    required 
                    className="bg-card/20 border-border/50 min-h-[100px] focus:ring-accent resize-none"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Calendar size={12} className="text-primary" /> Select Preferred Date
                </Label>
                <div className="bg-card/20 border border-border/50 rounded-2xl p-2 flex justify-center">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                  />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full h-12 rounded-xl font-bold uppercase tracking-widest bg-accent text-accent-foreground">
              Continue to Confirm
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 pt-4">
            <div className="bg-card/30 border border-border/50 rounded-2xl p-5 space-y-4">
               <h5 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Booking Summary</h5>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Category</p>
                   <p className="text-sm font-bold capitalize">{provider.category}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Consultation/Fee</p>
                   <p className="text-sm font-bold text-accent">{provider.fee}</p>
                 </div>
                 <div className="col-span-2">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold">Timeframe</p>
                   <p className="text-sm font-bold flex items-center gap-2">
                     <Clock size={14} className="text-primary" /> 
                     {provider.type === 'appointment' 
                       ? date?.toLocaleDateString() + ' (9:00 AM - 1:00 PM)' 
                       : 'ASAP (Expert will call to confirm)'}
                   </p>
                 </div>
               </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl h-11 border-border/50">Back</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] rounded-xl h-11 bg-accent text-accent-foreground font-bold">
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent animate-in zoom-in duration-500">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Request Confirmed!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
              {provider.name} has been notified. You will receive a verification call shortly to {provider.type === 'appointment' ? 'finalize the time' : 'confirm your location'}.
            </p>
            <Button onClick={resetModal} className="w-full mt-6 bg-primary rounded-xl h-11">Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
