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
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertCircle, AtSign, Calendar, CheckCircle, Lock, Mail, MapPin, Phone, User, UserPlus, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { authStyles } from "@/lib/design/auth-styles";
import * as z from "zod";

import { CHITTAGONG_AREAS } from "@/lib/constants/chittagong-areas";

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
  acceptTermsAndPrivacy: z
    .boolean()
    .refine((v) => v === true, "You must accept the Terms and Privacy Policy"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { acceptTermsAndPrivacy: false },
  });

  const [signupError, setSignupError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const onSubmit = async (data: SignupFormValues) => {
    setSignupError(null);
    try {
      const res = await signup({
        email: data.email,
        pass: data.password,
        name: data.name,
        username: data.username,
        mobile: data.mobile,
        location: data.location,
        dob: data.dob,
        profession: data.profession || "Not specified",
        acceptTermsAndPrivacy: data.acceptTermsAndPrivacy,
      });
      if (res && res.emailSent === false) {
        toast({ title: "Email Delivery Failed", description: res.emailError, variant: "destructive" });
      }
      setRegisteredEmail(data.email);
      setRegistrationSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setSignupError(message);
    }
  };

  if (registrationSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center space-y-6 py-6"
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-green-100 border-4 border-green-200 shadow-md">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div className="space-y-2">
          <h2 className={authStyles.heading}>Account Created Successfully!</h2>
          <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
            We&apos;ve sent a verification email to{" "}
            <span className="font-bold text-auth-foreground">{registeredEmail}</span>. Please check your inbox and click the verification link to activate your account.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Didn&apos;t receive it? Check your spam folder or contact support.
        </p>
        <Button
          type="button"
          onClick={onSwitch}
          className={authStyles.buttonSecondary}
        >
          Back to Sign In
        </Button>
      </motion.div>
    );
  }

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
          <Label htmlFor="name" className={authStyles.labelWithIcon}>
            <User className={authStyles.fieldIcon} /> Full Name *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            className={authStyles.input}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>
          )}
        </div>

        {/* Username & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="username" className={authStyles.labelWithIcon}>
              <AtSign className={authStyles.fieldIcon} /> Username *
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="username"
              className={authStyles.input}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-xs text-red-600 font-medium">{errors.username.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="mobile" className={authStyles.labelWithIcon}>
              <Phone className={authStyles.fieldIcon} /> Phone *
            </Label>
            <Input
              id="mobile"
              type="tel"
              placeholder="01XXXXXXXXX"
              className={authStyles.input}
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
            <Label htmlFor="email" className={authStyles.labelWithIcon}>
              <Mail className={authStyles.fieldIcon} /> Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className={authStyles.input}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="dob" className={authStyles.labelWithIcon}>
              <Calendar className={authStyles.fieldIcon} /> Date of Birth *
            </Label>
            <Input
              id="dob"
              type="date"
              className={authStyles.input}
              {...register("dob")}
            />
            {errors.dob && (
              <p className="text-xs text-red-600 font-medium">{errors.dob.message}</p>
            )}
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="space-y-2 text-left">
          <Label htmlFor="location" className={authStyles.labelWithIcon}>
            <MapPin className={authStyles.fieldIcon} /> Select Your Thana (Area) *
          </Label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger className={authStyles.selectTrigger}>
                  <SelectValue placeholder="Choose your Thana from the list below" />
                </SelectTrigger>
                <SelectContent className={authStyles.selectContent}>
                  {CHITTAGONG_AREAS.map((area) => (
                    <SelectItem key={area} value={area} className={authStyles.selectItem}>
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
          <Label htmlFor="profession" className={authStyles.labelWithIcon}>
            <UserPlus className={authStyles.fieldIconOptional} /> Profession (Optional)
          </Label>
          <Input
            id="profession"
            type="text"
            placeholder="e.g., Engineer, Doctor, Student, Business Owner"
            className={authStyles.input}
            {...register("profession")}
          />
        </div>

        {/* Password & Confirm Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="password" className={authStyles.labelWithIcon}>
              <Lock className={authStyles.fieldIcon} /> Password *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 6 characters"
                className={authStyles.inputWithToggle}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={authStyles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="confirmPassword" className={authStyles.labelWithIcon}>
              <Lock className={authStyles.fieldIcon} /> Confirm Password *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className={authStyles.inputWithToggle}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={authStyles.passwordToggle}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 text-left">
          <Controller
            name="acceptTermsAndPrivacy"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="acceptTermsAndPrivacy"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
            )}
          />
          <Label htmlFor="acceptTermsAndPrivacy" className="text-sm font-normal leading-snug text-gray-600">
            I agree to the{" "}
            <Link href="/terms" className="text-auth-brand underline" target="_blank">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-auth-brand underline" target="_blank">
              Privacy Policy
            </Link>
            .
          </Label>
        </div>
        {errors.acceptTermsAndPrivacy && (
          <p className="text-xs text-red-600 font-medium">{errors.acceptTermsAndPrivacy.message}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={authStyles.buttonPrimary}
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
            className="text-auth-brand font-bold hover:text-auth-brand-deep transition-all hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
