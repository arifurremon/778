"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyLevel, useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    Globe,
    Home,
    Image as ImageIcon,
    Lock,
    MapPin,
    Smile,
    X
} from "lucide-react";
import { useState } from "react";

interface CreatePostInput {
  author: {
    name: string;
    avatar: string;
    location: string;
    username: string;
  };
  content: string;
  images: string[];
  checkInLocation?: string;
  visibility: PrivacyLevel;
}

interface CreatePostProps {
  onCreate: (post: CreatePostInput) => void;
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
  const isError = remaining < 0;

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
    { value: "Public", icon: <Globe size={14} />, label: "Public" },
    { value: "Neighbours", icon: <Home size={14} />, label: "Neighbours" },
    { value: "Only Me", icon: <Lock size={14} />, label: "Only Me" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* TRIGGER CARD (FEED VIEW) */}
      <DialogTrigger asChild>
        <div className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-6">
          <div className="flex gap-3 items-center">
            <Avatar className="w-10 h-10 border border-border">
               <AvatarImage src={user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`} />
               <AvatarFallback className="font-bold">{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/60 hover:bg-muted transition-colors h-10 rounded-full px-4 flex items-center text-muted-foreground text-[15px] font-medium">
              What&apos;s on your mind, {user?.name?.split(' ')[0] || "there"}?
            </div>
          </div>
          
          <div className="border-t border-border mt-3 pt-3 flex justify-between px-1">
            <Button variant="ghost" className="flex-1 text-muted-foreground hover:bg-muted font-semibold text-sm h-10 rounded-lg">
              <ImageIcon size={24} className="text-green-500 mr-2" /> 
              <span className="hidden sm:inline">Photo/video</span>
              <span className="sm:hidden">Photo</span>
            </Button>
            <Button variant="ghost" className="flex-1 text-muted-foreground hover:bg-muted font-semibold text-sm h-10 rounded-lg">
              <MapPin size={24} className="text-red-500 mr-2" /> 
              <span className="hidden sm:inline">Check in</span>
              <span className="sm:hidden">Location</span>
            </Button>
            <Button variant="ghost" className="flex-1 text-muted-foreground hover:bg-muted font-semibold text-sm h-10 rounded-lg hidden sm:flex">
              <Smile size={24} className="text-yellow-500 mr-2" /> Feeling/activity
            </Button>
          </div>
        </div>
      </DialogTrigger>
      
      {/* MODAL (EXPANDED VIEW) */}
      <DialogContent className={`
        bg-background border-border p-0 flex flex-col gap-0
        ${isMobile 
          ? "w-full h-full max-w-none rounded-none inset-0 translate-x-0 translate-y-0" 
          : "sm:max-w-[500px] rounded-xl overflow-hidden shadow-2xl max-h-[85vh]"
        }
      `}>
        {/* Header */}
        <div className="relative flex items-center justify-center p-4 border-b border-border">
          <DialogTitle className="text-xl font-bold tracking-tight">Create post</DialogTitle>
          {/* Note: Shadcn Dialog adds its own close button automatically, but we can rely on it or override. We will rely on default Shadcn Close Button which is usually top-4 right-4 */}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col scrollbar-hide">
          {/* User Info & Privacy Pill */}
          <div className="flex items-center gap-3 mb-4">
             <Avatar className="w-10 h-10 border border-border">
               <AvatarImage src={user?.profileImage || `https://picsum.photos/seed/${user?.email}/100`} />
               <AvatarFallback className="font-bold">{user?.name?.[0]}</AvatarFallback>
             </Avatar>
             <div>
                <div className="font-bold text-[15px] text-foreground">
                  {user?.name} 
                  {checkInLocation && (
                    <span className="font-normal text-muted-foreground ml-1">
                      is at <span className="font-bold text-foreground">{checkInLocation}</span>
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 px-2.5 py-1 rounded-md text-[13px] font-semibold mt-0.5 transition-colors text-foreground">
                      {visibilityOptions.find(o => o.value === visibility)?.icon}
                      {visibility} 
                      <ChevronDown size={14} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover border-border rounded-lg shadow-xl w-48">
                    {visibilityOptions.map(opt => (
                      <DropdownMenuItem 
                        key={opt.value}
                        onClick={() => setVisibility(opt.value as PrivacyLevel)}
                        className="flex items-center gap-3 p-3 cursor-pointer text-sm font-medium"
                      >
                        <div className="bg-muted p-1.5 rounded-full text-foreground">{opt.icon}</div> 
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>

          {/* Text Area */}
          <div className="flex-1 flex flex-col">
            <Textarea 
              placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || "there"}?`}
              value={content}
              autoFocus
              onChange={(e) => setContent(e.target.value)}
              className={`
                flex-1 bg-transparent border-0 focus-visible:ring-0 resize-none p-0 shadow-none
                ${content.length < 85 && images.length === 0 ? 'text-2xl min-h-[150px]' : 'text-lg min-h-[120px]'}
                placeholder:text-muted-foreground/60
              `}
            />

            {/* Image Preview Grid */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-2 gap-2 mb-2 mt-4"
                >
                  {images.map((img, idx) => (
                    <div key={idx} className={`relative rounded-xl overflow-hidden border border-border group ${images.length === 1 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                      <img src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground p-1.5 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Add to your post & Submit */}
        <div className="p-4 pt-0">
          <div className="border border-border rounded-lg p-2.5 flex items-center justify-between shadow-sm mb-4">
            <span className="font-semibold px-2 text-[15px] text-foreground">Add to your post</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={addMockImage} disabled={images.length >= 3} className="rounded-full hover:bg-muted h-10 w-10">
                <ImageIcon size={24} className="text-green-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCheckIn} className="rounded-full hover:bg-muted h-10 w-10">
                <MapPin size={24} className="text-red-500" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted h-10 w-10 hidden sm:flex">
                <Smile size={24} className="text-yellow-500" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handlePost}
            disabled={!content.trim() || isError}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[15px] h-10 rounded-lg disabled:opacity-50"
          >
            Post
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
