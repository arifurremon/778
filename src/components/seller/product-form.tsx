
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Image as ImageIcon, Plus, X, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusiness } from "@/hooks/use-business";
import { toast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(3, "Name is too short"),
  description: z.string().min(10, "Provide a better description"),
  price: z.string().regex(/^৳?\d+(,\d+)*$/, "Enter a valid price (e.g. ৳1,500)"),
  deliveryCharge: z.string().default("৳50"),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSuccess: () => void;
  shopId?: string;
}

export function ProductForm({ onSuccess, shopId = "s-my-shop" }: ProductFormProps) {
  const { addProduct } = useBusiness();
  const [images, setImages] = useState<string[]>([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const addMockImage = () => {
    if (images.length >= 3) return;
    const newImage = `https://picsum.photos/seed/${Math.random()}/600/600`;
    setImages([...images, newImage]);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (images.length === 0) {
      toast({ variant: "destructive", title: "Images required", description: "Add at least one product photo." });
      return;
    }

    addProduct({
      ...data,
      shopId,
      images,
    });

    toast({ title: "Product Added", description: `${data.name} is now live in your shop.` });
    reset();
    setImages([]);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Images (Max 3)</Label>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 group">
                <img src={img} alt="Product" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button
                type="button"
                onClick={addMockImage}
                className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-accent/50 hover:text-accent transition-colors"
              >
                <Plus size={20} />
                <span className="text-[8px] font-bold uppercase">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Title</Label>
          <Input id="name" {...register("name")} placeholder="e.g. Premium Basmati Rice" className="bg-card/20 border-border/50 h-11" />
          {errors.name && <p className="text-[10px] text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Price</Label>
            <Input id="price" {...register("price")} placeholder="৳1,200" className="bg-card/20 border-border/50 h-11" />
            {errors.price && <p className="text-[10px] text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Delivery Charge</Label>
            <Input id="delivery" {...register("deliveryCharge")} placeholder="৳60" className="bg-card/20 border-border/50 h-11" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Describe features, weight, or specifications..." className="bg-card/20 border-border/50 min-h-[100px] resize-none" />
          {errors.description && <p className="text-[10px] text-destructive">{errors.description.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-accent text-accent-foreground font-bold h-12 rounded-xl shadow-lg shadow-accent/20 uppercase tracking-widest text-xs">
        {isSubmitting ? "Uploading..." : "Publish Product"}
      </Button>
    </form>
  );
}
