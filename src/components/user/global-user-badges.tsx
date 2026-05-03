
"use client";

import { BadgeCheck, Store, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User } from "@/hooks/use-auth";

interface GlobalUserBadgesProps {
  user: Partial<User> | any;
  size?: number;
  className?: string;
}

export function GlobalUserBadges({ user, size = 14, className = "flex items-center gap-1 ml-1.5" }: GlobalUserBadgesProps) {
  if (!user) return null;

  // Badge Privacy Logic
  // isVerified is ALWAYS mandatory and cannot be hidden
  // showShopBadge and showExpertBadge are user-controlled toggles
  const showShop = user.isSeller && (user.showShopBadge ?? true);
  const showExpert = user.isServiceProvider && (user.showExpertBadge ?? true);

  return (
    <TooltipProvider delayDuration={200}>
      <div className={className}>
        {/* Priority 1: Verified Resident (Mandatory) */}
        {user.isVerified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <BadgeCheck size={size} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
            </TooltipTrigger>
            <TooltipContent className="bg-cyan-950 text-cyan-200 border-cyan-800 text-[10px] font-bold uppercase tracking-widest">
              Verified Resident
            </TooltipContent>
          </Tooltip>
        )}

        {/* Priority 2: Verified Merchant (Toggleable) */}
        {showShop && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Store size={size} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
            </TooltipTrigger>
            <TooltipContent className="bg-emerald-950 text-emerald-200 border-emerald-800 text-[10px] font-bold uppercase tracking-widest">
              Verified Merchant
            </TooltipContent>
          </Tooltip>
        )}

        {/* Priority 3: Community Expert (Toggleable) */}
        {showExpert && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Star size={size} className="text-purple-400 fill-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            </TooltipTrigger>
            <TooltipContent className="bg-purple-950 text-purple-200 border-purple-800 text-[10px] font-bold uppercase tracking-widest">
              Community Expert
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
