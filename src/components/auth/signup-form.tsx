"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, AtSign, Calendar, Lock, Mail, MapPin, Phone, User, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

const CHITTAGONG_AREAS = [
  'Akbar Shah', 'Bakalia', 'Bandar', 'Bayezid Bostami', 
  'Chandgaon', 'Chawkbazar', 'Double Mooring', 'EPZ', 
  'Halishahar', 'Karnaphuli', 'Khulshi', 'Kotwali', 
  'Pahartali', 'Panchlaish', 'Patenga', 'Sadarghat'
] as const;

const signupSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  mobile: z.string().regex(/^(?:\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladesh mobile number"),
  email: z.string().email("Please enter a valid email address"),
  location: z.enum(CHITTAGONG_AREAS, {
    errorMap: () => ({ message: "Please select your Thana" }),
  }),
  profession: z.string().optional(),
  dob: z.string().min(1, "Date of birth is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const { signup } = useAuth();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const [signupError, setSignupError] = useState<string | null>(null);

  const onSubmit = async (data: SignupFormValues) => {
    setSignupError(null);
    try {
      await signup({
        email: data.email,
        pass: data.password,
        name: data.name,
        username: data.username,
        mobile: data.mobile,
        location: data.location,
        dob: data.dob,
        profession: data.profession || "Not specified"
      });
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setSignupError(message);
    }
  };

  return (
    <div className="space-y-8">


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {signupError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl bg-red-50/80 border border-red-200/50 p-4 text-sm text-red-700 backdrop-blur-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{signupError}</span>
          </motion.div>
        )}
        {/* Full Name */}
        <div className="space-y-2 text-left">
          <Label htmlFor="name" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
            <User className="w-4 h-4 text-blue-600" /> Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Username & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="username" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
              <AtSign className="w-4 h-4 text-blue-600" /> Username *
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-red-600 font-medium">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="mobile" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
              <Phone className="w-4 h-4 text-blue-600" /> Phone *
            </Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="01XXXXXXXXX"
              className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
              {...register("mobile")}
            />
            {errors.mobile && (
              <p className="text-xs text-red-600 font-medium">{errors.mobile.message}</p>
            )}
          </div>
        </div>

        {/* Email & DOB Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="email" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
              <Mail className="w-4 h-4 text-blue-600" /> Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="dob" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
              <Calendar className="w-4 h-4 text-blue-600" /> Date of Birth *
            </Label>
            <Input
              id="dob"
              type="date"
              className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 block w-full font-medium shadow-sm hover:border-slate-300/80"
              {...register("dob")}
            />
            {errors.dob && (
              <p className="text-xs text-red-600 font-medium">{errors.dob.message}</p>
            )}
          </div>
        </div>

        {/* Location Dropdown - Full Width for Better Visibility */}
        <div className="space-y-2 text-left">
          <Label htmlFor="location" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
            <MapPin className="w-4 h-4 text-blue-600" /> Select Your Thana (Area) *
          </Label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className="h-13 px-5 rounded-2xl bg-white/70 border-2 border-slate-200/80 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 w-full text-left font-bold shadow-md hover:border-slate-300/80 text-base">
                  <SelectValue placeholder="Choose your Thana from the list below" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200/80 shadow-xl max-h-[400px]">
                  {CHITTAGONG_AREAS.map((area) => (
                    <SelectItem key={area} value={area} className="cursor-pointer hover:bg-blue-100 font-medium py-2">
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.location && (
            <p className="text-xs text-red-600 font-medium">{errors.location.message}</p>
          )}
        </div>

        {/* Profession - Optional */}
        <div className="space-y-2 text-left">
          <Label htmlFor="profession" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
            <UserPlus className="w-4 h-4 text-green-600" /> Profession (Optional)
          </Label>
          <Input
            id="profession"
            type="text"
            placeholder="e.g., Engineer, Doctor, Student, Business Owner"
            className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
            {...register("profession")}
          />
        </div>

        {/* Password & Confirm Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="password" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
              <Lock className="w-4 h-4 text-blue-600" /> Password *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 6 characters"
              className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="confirmPassword" className="flex items-center gap-2 font-bold text-sm text-slate-800 uppercase tracking-wide">
              <Lock className="w-4 h-4 text-blue-600" /> Confirm Password *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              className="h-12 px-5 rounded-2xl bg-white/70 border border-slate-200/60 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/25 transition-all text-slate-900 placeholder:text-slate-400 font-medium shadow-sm hover:border-slate-300/80"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-13 mt-8 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white font-bold text-base shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed tracking-wide uppercase"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Create Account <UserPlus className="w-5 h-5" />
            </span>
          )}
        </Button>
      </form>



      <div className="pt-6 border-t border-gray-200/50 text-center">
        <p className="text-sm text-gray-600 font-medium">
          Already a member?{" "}
          <button
            onClick={onSwitch}
            className="text-blue-600 font-bold hover:text-blue-700 transition-all hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
