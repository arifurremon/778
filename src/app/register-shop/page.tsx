"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ShopRegistrationFormInput } from "@/lib/shop-registration";
import { mapShopRegistrationToApiPayload } from "@/lib/shop-registration";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { CHITTAGONG_AREAS } from "@/lib/mock-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Briefcase,
    Building,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    FileCheck,
    Mail,
    Phone,
    ShieldCheck,
    Store,
    Truck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
const categories = ["Grocery", "Electronics", "Fashion", "Pharmacy", "Restaurant", "Stationery", "Home Decor", "Beauty", "Others"];

const registerSchema = z.object({
  businessName: z.string().min(3, "Business name is too short"),
  description: z.string().min(20, "Please provide a detailed description (min 20 chars)"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  customCategory: z.string().optional(),
  businessEmail: z.string().email("Invalid business email"),
  businessPhone: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Invalid Bangladeshi phone number"),
  isOffline: z.boolean().default(false),
  address: z.string().optional(),
  deliveryAreas: z.array(z.string()).min(1, "Select at least one delivery area"),
  outsideCity: z.boolean().default(false),
  deliveryMethod: z.enum(['Self', 'Third-party']),
  codAvailable: z.boolean().default(true),
  deliveryTimeline: z.string().min(1, "Select delivery timeline"),
  nidNumber: z.string().min(10, "Valid NID is required (min 10 digits)"),
  hasTradeLicense: z.boolean().default(false),
  tradeLicenseNumber: z.string().optional(),
  declaresAdultContent: z.boolean().refine(v => v === true, "Compliance is mandatory"),
  payoutMethod: z.enum(['bKash', 'Nagad', 'Bank']),
  payoutDetails: z.string().min(5, "Payout details required"),
  agreedToTerms: z.boolean().refine(v => v === true, "You must agree to terms"),
}).refine(data => {
  if (data.categories.includes("Others") && !data.customCategory) {
    return false;
  }
  return true;
}, {
  message: "Please specify your unique category",
  path: ["customCategory"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const steps = [
  { id: 1, title: "Identity", icon: <Building size={16} /> },
  { id: 2, title: "Logistics", icon: <Truck size={16} /> },
  { id: 3, title: "Compliance", icon: <ShieldCheck size={16} /> },
  { id: 4, title: "Review", icon: <FileCheck size={16} /> },
];

export default function RegisterShopPage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      categories: [],
      deliveryAreas: [],
      isOffline: false,
      outsideCity: false,
      deliveryMethod: 'Self',
      codAvailable: true,
      hasTradeLicense: false,
      declaresAdultContent: false,
      agreedToTerms: false,
      payoutMethod: 'bKash',
      businessEmail: user?.email || "",
      businessPhone: user?.mobile || "",
    }
  });

  const watchAll = watch();

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];
    if (step === 1) fieldsToValidate = ["businessName", "description", "categories", "customCategory", "businessEmail", "businessPhone"];
    if (step === 2) fieldsToValidate = ["deliveryAreas", "deliveryTimeline", "deliveryMethod"];
    if (step === 3) fieldsToValidate = ["nidNumber", "declaresAdultContent", "payoutDetails", "agreedToTerms"];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const toggleItem = (
    list: string[],
    item: string,
    fieldName: Extract<keyof RegisterFormValues, 'categories' | 'deliveryAreas'>
  ) => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item) 
      : [...list, item];
    setValue(fieldName, newList);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = mapShopRegistrationToApiPayload(data as ShopRegistrationFormInput);
      await api.post("/api/shops", payload);
      await refreshProfile();
      toast({
        title: "Application Under Review",
        description: "We will verify your documents within 24-48 hours.",
      });
      router.push("/profile");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not submit your shop application.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <PageHeader
            eyebrow="Merchant Enrollment Wizard"
            eyebrowIcon={Store}
            title={
              <>
                Register Your <span className="text-accent">Shop</span>
              </>
            }
          >
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 pt-2">
            <div className="flex items-center gap-4 bg-card/20 border border-border/30 rounded-2xl px-4 py-2 w-full md:w-auto">
              {steps.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= s.id ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > s.id ? <CheckCircle2 size={12} /> : s.id}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest hidden lg:block ${step === s.id ? 'text-accent' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                  {s.id !== 4 && <div className="w-4 h-[1px] bg-border mx-1 hidden lg:block" />}
                </div>
              ))}
            </div>
            </div>
          </PageHeader>
          <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-accent"
              initial={{ width: "25%" }}
              animate={{ width: `${(step / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card/20 border border-border/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 1: Business Identity</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Brand and contact details</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Shop / Business Name</Label>
                      <Input id="businessName" {...register("businessName")} placeholder="e.g. Chattala Tech Mart" className="bg-background/40 h-12" />
                      {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Shop Description</Label>
                      <Textarea id="description" {...register("description")} placeholder="Describe your shop..." className="bg-background/40 min-h-[100px]" />
                      {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Mail size={14} className="text-accent" /> Business Email</Label>
                        <Input {...register("businessEmail")} placeholder="shop@email.com" className="bg-background/40 h-12" />
                        {errors.businessEmail && <p className="text-xs text-destructive">{errors.businessEmail.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Phone size={14} className="text-accent" /> Business Phone</Label>
                        <Input {...register("businessPhone")} placeholder="017XXXXXXXX" className="bg-background/40 h-12" />
                        {errors.businessPhone && <p className="text-xs text-destructive">{errors.businessPhone.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Business Categories</Label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleItem(watchAll.categories, cat, "categories")}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-smooth ${
                              watchAll.categories.includes(cat) ? 'bg-accent border-accent text-accent-foreground shadow-lg' : 'bg-background/20 border-border/50 text-muted-foreground hover:border-accent/30'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      {watchAll.categories.includes("Others") && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-2">
                          <Label>Specify Category</Label>
                          <Input {...register("customCategory")} placeholder="Enter your unique category..." className="bg-background/40 h-12" />
                          {errors.customCategory && <p className="text-xs text-destructive">{errors.customCategory.message}</p>}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Truck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 2: Logistics & Coverage</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Delivery and fulfillment</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-background/20 rounded-2xl border border-border/30">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold">Physical Storefront?</Label>
                        <p className="text-xs text-muted-foreground">Do you have an offline location in Chittagong?</p>
                      </div>
                      <Controller name="isOffline" control={control} render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )} />
                    </div>

                    {watchAll.isOffline && (
                      <Input {...register("address")} placeholder="Store Address in Chittagong..." className="bg-background/40 h-12" />
                    )}

                    <div className="space-y-3">
                      <Label>Delivery Coverage (Chittagong Thanas)</Label>
                      <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-4 bg-background/20 rounded-2xl border border-border/30 scrollbar-hide">
                        {CHITTAGONG_AREAS.map(area => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleItem(watchAll.deliveryAreas, area, "deliveryAreas")}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase border transition-smooth ${
                              watchAll.deliveryAreas.includes(area) ? 'bg-primary border-primary text-white' : 'bg-background/20 border-border/50 text-muted-foreground'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-background/20 rounded-2xl border border-border/30 space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Fulfillment</Label>
                        <Select onValueChange={(v) => setValue("deliveryMethod", v as "Self" | "Third-party")} defaultValue={watchAll.deliveryMethod}>
                          <SelectTrigger className="bg-background/40 h-11"><SelectValue placeholder="Delivery Method" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Self">Self / Own Delivery</SelectItem>
                            <SelectItem value="Third-party">Third-party Assistance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4 bg-background/20 rounded-2xl border border-border/30 space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Timeline</Label>
                        <Select onValueChange={(v) => setValue("deliveryTimeline", v)} defaultValue={watchAll.deliveryTimeline}>
                          <SelectTrigger className="bg-background/40 h-11"><SelectValue placeholder="Timeline" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Within 24 hours">Within 24 hours</SelectItem>
                            <SelectItem value="2-3 days">2-3 Days</SelectItem>
                            <SelectItem value="7 days">7 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-background/20 rounded-2xl border border-border/30">
                      <Label className="text-sm font-bold">Cash on Delivery (COD)?</Label>
                      <Controller name="codAvailable" control={control} render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )} />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 3: Compliance & Payouts</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Verification and payments</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>National ID Number (NID)</Label>
                      <Input {...register("nidNumber")} placeholder="1234567890" className="bg-background/40 h-12" />
                    </div>

                    <div className="p-6 bg-background/20 rounded-2xl border border-border/30 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={16} className="text-accent" />
                        <h4 className="text-sm font-bold">Earnings Payout Method</h4>
                      </div>
                      <div className="flex gap-2">
                        {['bKash', 'Nagad', 'Bank'].map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setValue("payoutMethod", method as "bKash" | "Nagad" | "Bank")}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border transition-smooth ${
                              watchAll.payoutMethod === method ? 'bg-accent border-accent text-accent-foreground shadow-lg' : 'bg-background/40 border-border/30 text-muted-foreground'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                      <Input {...register("payoutDetails")} placeholder={`Enter ${watchAll.payoutMethod} Account details...`} className="bg-background/40 h-12" />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-widest opacity-60">Terms & Policy</Label>
                      <ScrollArea className="h-[120px] bg-background/40 border border-border/30 rounded-2xl p-4 text-[10px] text-muted-foreground leading-relaxed">
                        <p className="font-bold mb-2 text-foreground">THE CHATTALA MERCHANT TERMS</p>
                        <p>1. Merchants must provide accurate NID and business information.</p>
                        <p>2. Prohibited or illegal items are strictly banned from the platform.</p>
                        <p>3. Payouts are processed every 7 days after successful order delivery.</p>
                        <p>4. The Chattala reserves the right to suspend accounts for fraudulent activities.</p>
                        <p>5. Service fees may apply per transaction as per the current tariff.</p>
                      </ScrollArea>
                      <div className="flex items-start gap-3 mt-4">
                        <Controller name="agreedToTerms" control={control} render={({ field }) => (
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                        )} />
                        <Label className="text-[10px] leading-tight cursor-pointer">I agree to the Terms of Service and Privacy Policy of The Chattala.</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 4: Review & Finalize</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Verify before submission</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SummaryCard title="Identity">
                      <p className="text-xs font-bold">{watchAll.businessName}</p>
                      <p className="text-[10px] text-muted-foreground">{watchAll.categories.join(", ")}</p>
                    </SummaryCard>
                    <SummaryCard title="Contact">
                      <p className="text-[10px] font-mono">{watchAll.businessEmail}</p>
                      <p className="text-[10px] font-mono">{watchAll.businessPhone}</p>
                    </SummaryCard>
                    <SummaryCard title="Logistics">
                      <p className="text-[10px]">{watchAll.deliveryAreas.length} Thanas Covered</p>
                      <p className="text-[10px] text-accent uppercase font-bold">{watchAll.deliveryMethod} Delivery</p>
                    </SummaryCard>
                    <SummaryCard title="Finance">
                      <p className="text-[10px] font-bold uppercase text-emerald-400">{watchAll.payoutMethod}</p>
                      <p className="text-[10px] truncate">{watchAll.payoutDetails}</p>
                    </SummaryCard>
                  </div>

                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="text-accent shrink-0" size={20} />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold">Verification Timeline</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Our compliance team in Chittagong will review your NID ({watchAll.nidNumber}) and business model. This process usually takes 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex gap-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] border-border/50">
                    <ChevronLeft size={14} className="mr-2" /> Back
                  </Button>
                )}
                
                {step < 4 ? (
                  <Button type="button" onClick={nextStep} className="flex-[2] bg-primary h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    Continue <ChevronRight size={14} className="ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-accent text-accent-foreground h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20">
                    {isSubmitting ? "Submitting..." : "Submit Application"} <FileCheck size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </div>
  );
}

function SummaryCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-background/20 border border-border/30 rounded-2xl p-5 space-y-2">
      <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-accent/80 border-b border-border/10 pb-1">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}