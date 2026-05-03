
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Image as ImageIcon, 
  MapPin, 
  X, 
  Send,
  Plus,
  ChevronLeft,
  Smile,
  Globe,
  Home,
  Lock,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, PrivacyLevel } from "@/hooks/use-auth";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreatePostProps {
  onCreate: (post: { author: any, content: string, images: string[], checkInLocation?: string, visibility: PrivacyLevel }) => void;
}

export default function CreatePost({ onCreate }: CreatePostProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [checkInLocation, setCheckInLocation] = useState<string | undefined>(undefined);
  const [visibility, setVisibility] = useState<PrivacyLevel>("Public");

  // Character Limit Logic
  const isVerified = user?.isVerified ?? false;
  const maxChars = isVerified ? 1075 : 575;
  const charCount = content.length;
  const remaining = maxChars - charCount;
  const isWarning = remaining <= 50 && remaining >= 0;
  const isError = remaining < 0;

  // Circular Progress Values
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(charCount, maxChars) / maxChars) * circumference;

  const handlePost = () => {
    if (!content.trim() || isError) return;
    
    onCreate({
      author: {
        name: user?.name || "Guest User",
        avatar: user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`,
        location: user?.location || "Unknown",
        username: user?.username || "guest"
      },
      content,
      images,
      checkInLocation,
      visibility
    });

    setContent("");
    setImages([]);
    setCheckInLocation(undefined);
    setVisibility("Public");
    setIsOpen(false);
  };

  const addMockImage = () => {
    if (images.length >= 3) return;
    const newImage = `https://picsum.photos/seed/${Math.random()}/800/400`;
    setImages([...images, newImage]);
  };

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleCheckIn = () => {
    const spots = ['GEC Circle', 'Panchlaish', 'Patenga Beach', 'Agrabad C/A', 'Chawkbazar Maidan'];
    const randomSpot = spots[Math.floor(Math.random() * spots.length)];
    setCheckInLocation(randomSpot);
  };

  const visibilityOptions = [
    { value: "Public", icon: <Globe size={12} />, label: "Public" },
    { value: "Neighbours", icon: <Home size={12} />, label: "Neighbours" },
    { value: "Only Me", icon: <Lock size={12} />, label: "Only Me" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="bg-card border border-border/60 rounded-2xl p-5 hover:bg-card/80 transition-all duration-300 shadow-sm cursor-pointer flex gap-4 items-center group">
          <Avatar className="w-10 h-10 border border-border/50 shadow-sm">
             <AvatarImage src={user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`} />
             <AvatarFallback className="font-bold">{user?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-background h-11 rounded-full border border-border/30 flex items-center px-6 text-muted-foreground text-sm font-bold group-hover:border-accent/30 transition-colors">
            {isMobile ? "What's happening today?" : "Share your thoughts with the Chittagong community..."}
          </div>
          <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95">
             <Plus size={20} />
          </Button>
        </div>
      </DialogTrigger>
      
      <DialogContent className={`
        bg-background border-border p-0 overflow-hidden flex flex-col
        ${isMobile 
          ? "w-full h-full max-w-none rounded-none inset-0 translate-x-0 translate-y-0" 
          : "sm:max-w-[550px] rounded-3xl max-h-[90vh]"
        }
      `}>
        {/* Refined Header */}
        <div className="p-4 md:p-6 border-b border-border/10 flex items-center justify-between bg-card/5 backdrop-blur-md">
          {isMobile ? (
            <button 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm"
            >
              <ChevronLeft size={20} />
              <span>Cancel</span>
            </button>
          ) : (
            <DialogTitle className="text-xl font-bold tracking-tight">Create Post</DialogTitle>
          )}

          {/* Right side - Just Character Progress Engine */}
          <div className="flex items-center gap-2 pr-4 md:pr-0">
             <span className={`text-[10px] font-black tabular-nums ${isError ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-muted-foreground'}`}>
               {remaining}
             </span>
             <svg className="w-5 h-5 -rotate-90">
                <circle
                  cx="10" cy="10" r={radius}
                  stroke="currentColor" strokeWidth="2.5" fill="transparent"
                  className="text-muted-foreground/10"
                />
                <motion.circle
                  cx="10" cy="10" r={radius}
                  stroke="currentColor" strokeWidth="2.5" fill="transparent"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset: offset }}
                  className={`${isError ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-accent'} transition-colors duration-300`}
                />
             </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide flex flex-col">
          <div className="flex items-center gap-3 shrink-0">
             <Avatar className="w-12 h-12 border border-border/50">
               <AvatarImage src={user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`} />
               <AvatarFallback className="font-bold">{user?.name?.[0]}</AvatarFallback>
             </Avatar>
             <div className="flex flex-col text-left">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{user?.name}</span>
                  {checkInLocation && (
                    <span className="text-sm font-medium text-muted-foreground">
                      is at <span className="text-foreground font-bold">{checkInLocation}</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-widest">
                    <MapPin size={8} /> {user?.location}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        {visibilityOptions.find(o => o.value === visibility)?.icon}
                        <span>{visibility}</span>
                        <ChevronDown size={8} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-popover border-border">
                      {visibilityOptions.map(opt => (
                        <DropdownMenuItem 
                          key={opt.value}
                          onClick={() => setVisibility(opt.value as PrivacyLevel)}
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                        >
                          {opt.icon} {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
             </div>
          </div>

          <div className="flex-1 flex flex-col">
            <Textarea 
              placeholder={isMobile ? "What's happening today?" : "Share your thoughts with the Chittagong community..."}
              value={content}
              autoFocus
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[250px] md:min-h-[180px] bg-transparent border-0 focus-visible:ring-0 text-xl md:text-lg leading-relaxed resize-none p-0 font-bold placeholder:text-muted-foreground/40 shadow-none"
            />

            <AnimatePresence>
              {images.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-3 gap-3 mb-6"
                >
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 shadow-md group">
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Unified Footer (Desktop & Mobile) */}
        <div className="p-4 md:p-6 border-t border-border/10 bg-card/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addMockImage}
                disabled={images.length >= 3}
                className="text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-full px-4 h-10 font-bold focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              >
                <ImageIcon size={20} className="mr-2 text-emerald-500" /> 
                <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Photo</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCheckIn}
                className="text-muted-foreground hover:text-accent hover:bg-accent/5 rounded-full px-4 h-10 font-bold focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              >
                <MapPin size={20} className="mr-2 text-rose-500" /> 
                <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">Check-in</span>
                {checkInLocation && isMobile && (
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1 truncate max-w-[80px] text-accent">
                    {checkInLocation}
                  </span>
                )}
              </Button>
            </div>
            
            <Button 
              onClick={handlePost}
              disabled={!content.trim() || isError}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-black uppercase tracking-[0.2em] text-[11px] px-10 h-11 rounded-full shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-30"
            >
              Post <Send size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
