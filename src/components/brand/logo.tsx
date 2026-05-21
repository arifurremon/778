"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  animate?: boolean;
  width?: number;
}

const DARK_LOGO = "/logo-full.png?v=2";
const LIGHT_LOGO = "/logo-full.png?v=2";

export default function Logo({ className, animate, width = 140 }: LogoProps) {
  const height = Math.round(width * 0.35); // maintain aspect ratio

  return (
    <div className={cn("flex items-center select-none", className)}>
      {/* Light mode logo — shown when theme is light, hidden in dark */}
      <Image
        src={LIGHT_LOGO}
        alt="The Chattala"
        width={width}
        height={height}
        priority
        className="block dark:hidden object-contain"
      />
      {/* Dark mode logo — hidden in light, shown in dark */}
      <Image
        src={DARK_LOGO}
        alt="The Chattala"
        width={width}
        height={height}
        priority
        className="hidden dark:block object-contain"
      />
    </div>
  );
}
