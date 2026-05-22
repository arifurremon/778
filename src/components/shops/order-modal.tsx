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
import { useAuth } from "@/hooks/use-auth";
import { useBusiness } from "@/hooks/use-business";
import { toast } from "@/hooks/use-toast";
import type { MockProduct } from "@/lib/mock-data";
import { CheckCircle2, MapPin, Phone as PhoneIcon, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface OrderModalProps {
  product: MockProduct & { shopName?: string };
  shopId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ product, shopId, isOpen, onClose }: OrderModalProps) {
  const { user } = useAuth();
  const { addOrder } = useBusiness();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.mobile || "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    addOrder({
      shopId,
      productId: product.id,
      productName: product.name,
      buyerName: user?.name || "Anonymous",
      buyerEmail: user?.email || "",
      phone: formData.phone,
      address: formData.address,
      price: String(product.price),
    });

    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    setStep(2);
    
    toast({
      title: "Order Placed!",
      description: "The seller has been notified of your order.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border-border overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart size={20} className="text-accent" /> Secure Checkout
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
            Purchasing from {product.shopName || "Local Seller"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4 text-left">
            <div className="bg-card/30 border border-border/50 rounded-2xl p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border/50">
                <img src={product.image} className="object-cover w-full h-full" alt={product.name} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{product.name}</h4>
                <p className="text-accent font-bold text-sm">{product.price}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <PhoneIcon size={12} className="text-primary" /> Contact Number
                </Label>
                <Input 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  placeholder="017XXXXXXXX" 
                  required 
                  className="bg-card/20 border-border/50 h-11 focus:ring-accent font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin size={12} className="text-primary" /> Delivery Address
                </Label>
                <Textarea 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Street, House, Area in Chittagong..." 
                  required 
                  className="bg-card/20 border-border/50 min-h-[100px] focus:ring-accent resize-none font-bold"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl font-bold uppercase tracking-widest bg-accent text-accent-foreground shadow-lg shadow-accent/20"
            >
              {isSubmitting ? "Processing..." : "Confirm Order"}
            </Button>
          </form>
        ) : (
          <div className="py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center text-accent animate-in zoom-in duration-500">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Order Successful!</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] font-bold">
              Your order has been sent to the seller. They will contact you shortly to confirm delivery details.
            </p>
            <Button onClick={onClose} className="w-full mt-6 bg-primary rounded-xl h-11 font-bold uppercase text-xs">Back to Shop</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
