"use client";

import Logo from "@/components/brand/logo";
import { authStyles } from "@/lib/design/auth-styles";
import { MapPin, MessageCircle, Shield, Users } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: MapPin,
    title: "Hyperlocal",
    description: "Connect with your Thana and neighbourhood",
  },
  {
    icon: Users,
    title: "Community",
    description: "Groups, posts, and local discussions",
  },
  {
    icon: MessageCircle,
    title: "Real-time",
    description: "Live chat and instant updates",
  },
  {
    icon: Shield,
    title: "Secure",
    description: "Verified members and privacy controls",
  },
] as const;

const stats = [
  { value: "41", label: "Thanas" },
  { value: "24/7", label: "Active" },
  { value: "100%", label: "Local" },
] as const;

export default function AuthBrandPanel() {
  return (
    <div className={authStyles.brandPanel}>
      <div className={authStyles.brandPanelOverlay} />
      <div className={authStyles.brandPanelGlow} />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo width={148} className="brightness-0 invert drop-shadow-sm" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className={authStyles.brandTagline}
        >
          Chittagong&apos;s hyperlocal community platform — stay connected with the people around you.
        </motion.p>

        <ul className={`${authStyles.brandFeatureList} hidden sm:block`}>
          {features.map((feature, index) => (
            <motion.li
              key={feature.title}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.12 + index * 0.06 }}
              className={authStyles.brandFeatureItem}
            >
              <div className={authStyles.brandFeatureIcon}>
                <feature.icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className={authStyles.brandFeatureTitle}>{feature.title}</p>
                <p className={authStyles.brandFeatureDesc}>{feature.description}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className={`${authStyles.brandStats} hidden lg:grid`}
      >
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className={authStyles.brandStatValue}>{stat.value}</p>
            <p className={authStyles.brandStatLabel}>{stat.label}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
