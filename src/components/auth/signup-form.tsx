"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, MapPin, Phone, Mail, User, Lock, AtSign, Calendar, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Logo from "@/components/brand/logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHITTAGONG_AREAS = [
  'Akbar Shah', 'Bakalia', 'Bandar', 'Bayezid Bostami', 
  'Chandgaon', 'Chawkbazar', 'Double Mooring', 'EPZ', 
  'Halishahar', 'Karnaphuli', 'Khulshi', 'Kotwali', 
  'Pahartali', 'Panchlaish', 'Patenga', 'Sadarghat'
] as const;

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  preferredName: z.string().min(2, "Nickname must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  email: z.string().email("Please enter a valid email address"),
  mobile: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladesh mobile number"),
  location: z.enum(CHITTAGONG_AREAS, {
    errorMap: () => ({ message: "Please select your Thana" }),
  }),
  dob: z.string().min(1, "Date of birth is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    await signup({
      email: data.email,
      pass: data.password,
      name: data.name,
      preferredName: data.preferredName,
      username: data.username,
      mobile: data.mobile,
      location: data.location,
      dob: data.dob
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6">
        <Link href="/dashboard" className="transition-opacity hover:opacity-90">
          <Logo width={180} className="cursor-pointer mx-auto" />
        </Link>
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-headline font-bold tracking-tight text-foreground">Join the Community</h2>
          <p className="text-sm text-muted-foreground">Discover Chittagong like never before</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2 text-left">
          <Label htmlFor="name" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
            <User className="w-4 h-4 text-primary" /> Full Name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder=""
            className="bg-background/40 border-border h-11 focus:ring-primary"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Preferred Name */}
        <div className="space-y-2 text-left">
          <Label htmlFor="preferredName" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
            <Heart className="w-4 h-4 text-accent" /> What should we call you?
          </Label>
          <Input
            id="preferredName"
            type="text"
            placeholder=""
            className="bg-background/40 border-border h-11 focus:ring-primary"
            {...register("preferredName")}
          />
          {errors.preferredName && (
            <p className="text-xs text-destructive">{errors.preferredName.message}</p>
          )}
        </div>

        {/* Username & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="username" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              <AtSign className="w-4 h-4 text-primary" /> Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder=""
              className="bg-background/40 border-border h-11 focus:ring-primary"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              <Mail className="w-4 h-4 text-primary" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder=""
              className="bg-background/40 border-border h-11 focus:ring-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mobile Number */}
          <div className="space-y-2 text-left">
            <Label htmlFor="mobile" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              <Phone className="w-4 h-4 text-primary" /> Mobile
            </Label>
            <Input
              id="mobile"
              type="tel"
              placeholder=""
              className="bg-background/40 border-border h-11 focus:ring-primary"
              {...register("mobile")}
            />
            {errors.mobile && (
              <p className="text-xs text-destructive">{errors.mobile.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2 text-left">
            <Label htmlFor="dob" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" /> DOB
            </Label>
            <Input
              id="dob"
              type="date"
              className="bg-background/40 border-border h-11 focus:ring-primary block w-full"
              {...register("dob")}
            />
            {errors.dob && (
              <p className="text-xs text-destructive">{errors.dob.message}</p>
            )}
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="space-y-2 text-left">
          <Label htmlFor="location" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" /> Location (Thana)
          </Label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="bg-background/40 border-border h-11 w-full text-left focus:ring-primary">
                  <SelectValue placeholder="Select your area" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-[300px]">
                  {CHITTAGONG_AREAS.map((area) => (
                    <SelectItem key={area} value={area} className="cursor-pointer">
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.location && (
            <p className="text-xs text-destructive">{errors.location.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2 text-left">
          <Label htmlFor="password" className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
            <Lock className="w-4 h-4 text-primary" /> Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="bg-background/40 border-border h-11 focus:ring-primary"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest py-6 h-auto transition-smooth mt-6 shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <span className="flex items-center gap-2 text-base">
              Create My Account <UserPlus className="w-5 h-5" />
            </span>
          )}
        </Button>
      </form>

      <div className="pt-4 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          Already a resident?{" "}
          <button
            onClick={onSwitch}
            className="text-primary font-black uppercase text-[11px] tracking-widest hover:underline transition-all"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
