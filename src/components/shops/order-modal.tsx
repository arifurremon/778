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
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { ShopOrderProduct } from "@/lib/shop-utils";
import { CheckCircle2, MapPin, Phone as PhoneIcon, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface OrderModalProps {
  product: ShopOrderProduct;
  shopId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ product, shopId, isOpen, onClose }: OrderModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.mobile || "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await api.post("/api/orders", {
        shopId,
        productId: product.id,
        phone: formData.phone,
        address: formData.address,
      });

      setStep(2);
      toast({
        title: "Order Placed!",
        description: "The seller has been notified of your order.",
      });

      // Redirect after showing success
      setTimeout(() => {
        router.push('/activity');
      }, 2000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
