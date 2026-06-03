"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceRegistrationFormInput } from "@/lib/service-registration";
import { mapServiceRegistrationToApiPayload } from "@/lib/service-registration";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { CHITTAGONG_AREAS } from "@/lib/constants/chittagong-areas";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
    Briefcase,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Code,
    CreditCard,
    FileCheck,
    GraduationCap,
    Scale,
    Scissors,
    ShieldCheck,
    Stethoscope,
    UserCircle,
    Wrench
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
const categories = [
  { id: "Doctor", label: "Doctor", icon: <Stethoscope size={16} /> },
  { id: "Engineer", label: "Engineer", icon: <Building2 size={16} /> },
  { id: "Home Tutor", label: "Home Tutor", icon: <GraduationCap size={16} /> },
  { id: "Technician", label: "Technician (AC/Fridge/Electric)", icon: <Wrench size={16} /> },
  { id: "Web/IT Professional", label: "Web/IT Professional", icon: <Code size={16} /> },
  { id: "Lawyer", label: "Lawyer", icon: <Scale size={16} /> },
  { id: "Beauty/Salon Expert", label: "Beauty/Salon Expert", icon: <Scissors size={16} /> },
  { id: "Others", label: "Others", icon: <Briefcase size={16} /> },
];

const registerSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  specialization: z.string().min(3, "Please specify your specialization"),
  experienceYears: z.string().min(1, "Experience is required"),
  serviceMode: z.enum(['Home', 'Office', 'Remote']),
  serviceAreas: z.array(z.string()).min(1, "Select at least one area"),
  availability: z.array(z.string()).min(1, "Select at least one day"),
  timeSlot: z.string().min(1, "Please specify a time slot"),
  pricing: z.string().min(1, "Please set your rate"),
  nidNumber: z.string().min(10, "Valid NID is required (min 10 digits)"),
  payoutMethod: z.enum(['bKash', 'Nagad', 'Bank']),
  payoutDetails: z.string().min(5, "Payout details required"),
  ethicsAgreed: z.boolean().refine(v => v === true, "Ethics agreement is mandatory"),
  termsAgreed: z.boolean().refine(v => v === true, "Terms agreement is mandatory"),
  // Category specific
  bmdcNumber: z.string().optional(),
  degrees: z.string().optional(),
  affiliation: z.string().optional(),
  iebNumber: z.string().optional(),
  expertise: z.string().optional(),
  institution: z.string().optional(),
  department: z.string().optional(),
  subjects: z.string().optional(),
  portfolio: z.string().optional(),
  techStack: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const steps = [
  { id: 1, title: "Identity", icon: <UserCircle size={16} /> },
  { id: 2, title: "Qualifications", icon: <GraduationCap size={16} /> },
  { id: 3, title: "Logistics", icon: <Clock size={16} /> },
  { id: 4, title: "Verification", icon: <ShieldCheck size={16} /> },
];

export default function RegisterServicePage() {
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      category: "",
      specialization: "",
      experienceYears: "",
      serviceMode: 'Home',
      serviceAreas: [],
      availability: [],
      timeSlot: "4 PM - 8 PM",
      pricing: "",
      nidNumber: "",
      payoutMethod: 'bKash',
      payoutDetails: "",
      ethicsAgreed: false,
      termsAgreed: false,
    }
  });

  const watchCategory = watch("category");
  const watchAll = watch();

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = [];
    if (step === 1) fieldsToValidate = ["category", "specialization"];
    if (step === 2) {
      fieldsToValidate = ["experienceYears"];
      if (watchCategory === "Doctor") fieldsToValidate.push("bmdcNumber", "degrees", "affiliation");
      if (watchCategory === "Engineer") fieldsToValidate.push("iebNumber", "expertise");
      if (watchCategory === "Home Tutor") fieldsToValidate.push("institution", "department", "subjects");
      if (watchCategory === "Web/IT Professional") fieldsToValidate.push("portfolio", "techStack");
    }
    if (step === 3) fieldsToValidate = ["serviceMode", "serviceAreas", "availability", "timeSlot", "pricing"];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const toggleItem = (
    list: string[],
    item: string,
    fieldName: Extract<keyof RegisterFormValues, 'serviceAreas' | 'availability'>
  ) => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item) 
      : [...list, item];
    setValue(fieldName, newList);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = mapServiceRegistrationToApiPayload(data as ServiceRegistrationFormInput);
      await api.post("/api/services", payload);
      await refreshProfile();
      toast({
        title: "Service Application Received",
        description: "Our verification team will review your credentials.",
      });
      router.push("/profile");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not submit your service application.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="mb-12 space-y-4">
          <PageHeader
            eyebrow="Professional Expert Enrollment"
            eyebrowIcon={Briefcase}
            title={
              <>
                List Your <span className="text-accent">Services</span>
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
                      <UserCircle size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 1: Professional Identity</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">General information</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label>Primary Service Category</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setValue("category", cat.id)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-smooth text-center ${
                              watchCategory === cat.id ? 'bg-accent border-accent text-accent-foreground shadow-lg' : 'bg-background/20 border-border/50 text-muted-foreground hover:border-accent/30'
                            }`}
                          >
                            {cat.icon}
                            <span className="text-[9px] font-bold uppercase tracking-tighter leading-tight">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                      {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specific Niche / Specialization</Label>
                      <Input id="specialization" {...register("specialization")} placeholder="e.g. Heart Specialist, Physics Tutor, Frontend Developer" className="bg-background/40 h-12" />
                      {errors.specialization && <p className="text-xs text-destructive">{errors.specialization.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 2: Qualifications & Experience</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Verify your expertise</p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">Total Years of Experience</Label>
                      <Input id="experienceYears" {...register("experienceYears")} placeholder="e.g. 5" className="bg-background/40 h-12" />
                      {errors.experienceYears && <p className="text-xs text-destructive">{errors.experienceYears.message}</p>}
                    </div>

                    {watchCategory === "Doctor" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="space-y-2">
                          <Label>BMDC Registration Number</Label>
                          <Input {...register("bmdcNumber")} placeholder="A-XXXXX" className="bg-background/40 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Degrees (comma separated)</Label>
                          <Input {...register("degrees")} placeholder="MBBS, FCPS, MD" className="bg-background/40 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Current Hospital / Chamber Affiliation</Label>
                          <Input {...register("affiliation")} placeholder="Chittagong Medical College" className="bg-background/40 h-11" />
                        </div>
                      </motion.div>
                    )}

                    {watchCategory === "Engineer" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="space-y-2">
                          <Label>IEB Membership Number</Label>
                          <Input {...register("iebNumber")} placeholder="M-XXXX" className="bg-background/40 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Field of Expertise</Label>
                          <Input {...register("expertise")} placeholder="Structural, Electrical, Civil" className="bg-background/40 h-11" />
                        </div>
                      </motion.div>
                    )}

                    {watchCategory === "Home Tutor" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="space-y-2">
                          <Label>University / College Name</Label>
                          <Input {...register("institution")} placeholder="CUET, CU, Chittagong College" className="bg-background/40 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Department & Year</Label>
                          <Input {...register("department")} placeholder="Mechanical Engg. 4th Year" className="bg-background/40 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Subjects you teach</Label>
                          <Input {...register("subjects")} placeholder="Math, Physics, English" className="bg-background/40 h-11" />
                        </div>
                      </motion.div>
                    )}

                    {watchCategory === "Web/IT Professional" && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Portfolio Link / GitHub</Label>
                          <Input {...register("portfolio")} placeholder="https://..." className="bg-background/40 h-11" />
                        </div>
                        <div className="space-y-2">
                          <Label>Primary Tech Stack</Label>
                          <Input {...register("techStack")} placeholder="React, Node.js, Python" className="bg-background/40 h-11" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 3: Service Logistics</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Availability and coverage</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Service Mode</Label>
                      <div className="flex gap-2">
                        {['Home', 'Office', 'Remote'].map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setValue("serviceMode", mode as "Home" | "Office" | "Remote")}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase border transition-smooth ${
                              watchAll.serviceMode === mode ? 'bg-accent border-accent text-accent-foreground shadow-lg' : 'bg-background/40 border-border/30 text-muted-foreground'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Preferred Service Areas (Chittagong Thanas)</Label>
                      <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-4 bg-background/20 rounded-2xl border border-border/30 scrollbar-hide">
                        {CHITTAGONG_AREAS.map(area => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleItem(watchAll.serviceAreas, area, "serviceAreas")}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase border transition-smooth ${
                              watchAll.serviceAreas.includes(area) ? 'bg-primary border-primary text-white' : 'bg-background/20 border-border/50 text-muted-foreground'
                            }`}
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Availability (Days)</Label>
                        <div className="flex flex-wrap gap-2">
                          {['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleItem(watchAll.availability, day, "availability")}
                              className={`w-10 h-10 rounded-lg text-[9px] font-bold uppercase border transition-smooth ${
                                watchAll.availability.includes(day) ? 'bg-accent border-accent text-accent-foreground' : 'bg-background/40 border-border/30 text-muted-foreground'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Time Slot</Label>
                        <Input {...register("timeSlot")} placeholder="e.g. 4 PM - 8 PM" className="bg-background/40 h-11" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Consultation Fee / Hourly Rate (৳)</Label>
                      <Input {...register("pricing")} placeholder="e.g. 1000" className="bg-background/40 h-11" />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Step 4: Legal & Verification</h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Financial and ethics</p>
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
                      <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <Controller name="ethicsAgreed" control={control} render={({ field }) => (
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                        )} />
                        <Label className="text-[11px] leading-tight cursor-pointer font-medium">
                          I solemnly swear to provide services ethically, maintain user privacy, and uphold the professional standards of my field in Chittagong.
                        </Label>
                      </div>
                      <div className="flex items-start gap-3 px-4">
                        <Controller name="termsAgreed" control={control} render={({ field }) => (
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                        )} />
                        <Label className="text-[10px] leading-tight cursor-pointer text-muted-foreground">
                          I agree to The Chattala's Professional Terms of Service and Privacy Policy.
                        </Label>
                      </div>
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
                    {isSubmitting ? "Submitting..." : "Submit Expert Application"} <FileCheck size={16} className="ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </form>
      </div>
  );
}