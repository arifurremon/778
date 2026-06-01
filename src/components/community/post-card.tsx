"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalUserBadges } from "@/components/user/global-user-badges";
import { useAuth } from "@/hooks/use-auth";
import { Post, useCommunity } from "@/hooks/use-community";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Ban,
    Bell,
    Bookmark,
    Check,
    Copy,
    Edit,
    EyeOff,
    MapPin,
    MessageSquare,
    MoreHorizontal,
    Repeat,
    Send,
    Share2,
    ThumbsDown,
    ThumbsUp,
    Trash2
} from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PostCardProps {
  post: Post;
}

// Brand SVGs
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 12 0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WhatsAppLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.393-.883-.786-1.48-1.758-1.653-2.055-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.214 1.36.183 1.872.109.57-.083 1.758-.716 2.006-1.408.248-.692.248-1.288.174-1.408-.074-.12-.272-.193-.57-.343zM12.01 21c-1.625 0-3.213-.437-4.606-1.264l-.33-.197-3.424.899.914-3.337-.217-.345C3.435 15.42 3 13.738 3 12.001c0-4.962 4.039-9 9.001-9 2.422 0 4.7.945 6.415 2.661 1.714 1.716 2.66 3.992 2.66 6.414 0 4.963-4.04 9.001-9.001 9.001zM12.01 0C5.38 0 0 5.38 0 12.01c0 2.124.553 4.197 1.602 6.015L0 24l6.155-1.612A11.94 11.94 0 0 0 12.01 24c6.63 0 12.01-5.38 12.01-12.01S18.64 0 12.01 0z"/>
  </svg>
);

const MessengerLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.302 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.25 14.938l-3.056-3.25L4.444 14.938l6.306-6.688 3.056 3.25 5.75-3.25-6.306 6.688z"/>
  </svg>
);

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    interactPost, 
    addComment, 
    likeComment,
    unlikeComment,
    deletePost, 
    toggleSavePost, 
    toggleFollowPost, 
    blockUser,
    repost 
  } = useCommunity();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [interaction, setInteraction] = useState<'helpful' | 'not-helpful' | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  // Share States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isRepostModalOpen, setIsRepostModalOpen] = useState(false);
  const [repostCaption, setRepostCaption] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const isOwner = user?.username === post.author.username;
  const isLongText = post.content.length > 180;
  const displayedContent = isLongText && !isExpanded 
    ? post.content.slice(0, 180) + "..." 
    : post.content;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(post.id, {
      author: {
        name: user?.name || "User",
        avatar: user?.profileImage || "",
        username: user?.username || "guest"
      },
      text: newComment
    });
    setNewComment("");
    setShowComments(true);
    toast({ title: "Comment Added", description: "Your response is now live." });
  };

  const handleReplyToComment = (commentAuthorUsername: string) => {
    setNewComment(`@${commentAuthorUsername} `);
    setShowComments(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/community?post=${post.id}`);
    setIsCopied(true);
    toast({ title: "Link Copied", description: "The direct link is now on your clipboard." });
    setTimeout(() => {
      setIsCopied(false);
      setIsShareModalOpen(false);
    }, 2000);
  };

  const handleExternalShare = (platform: 'fb' | 'messenger' | 'whatsapp') => {
    const url = encodeURIComponent(`${window.location.origin}/community?post=${post.id}`);
    const text = encodeURIComponent(`Check out this post on The Chattala: ${post.content.slice(0, 50)}...`);
    
    let shareUrl = '';
    if (platform === 'fb') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'messenger') shareUrl = `fb-messenger://share/?link=${url}`;
    if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    
    window.open(shareUrl, '_blank');
    setIsShareModalOpen(false);
  };

  const handleRepost = () => {
    if (!user) return;
    repost(post.id, repostCaption, {
      name: user.name || 'Anonymous',
      avatar: user.profileImage ?? '',
      location: user.location ?? '',
      username: user.username ?? '',
      isVerified: user.isVerified,
      isSeller: user.isSeller,
      isServiceProvider: user.isServiceProvider,
    });
    setRepostCaption("");
    setIsRepostModalOpen(false);
    setIsShareModalOpen(false);
    toast({ title: "Shared to Feed", description: "You have successfully reposted this discussion." });
  };

  return (
    <>
      <div className="bg-card border border-border/60 rounded-2xl p-5 hover:border-accent/40 transition-all duration-300 shadow-sm text-left box-border">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <Avatar 
              onClick={() => router.push(`/profile/${post.author.username}`)}
              className="w-10 h-10 border border-border/50 ring-2 ring-background hover:ring-accent transition-all cursor-pointer"
            >
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback className="font-bold">{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center">
                <h4 
                  onClick={() => router.push(`/profile/${post.author.username}`)}
                  className="text-sm font-bold tracking-tight text-foreground hover:text-accent hover:underline cursor-pointer"
                >
                  {post.author.name}
                </h4>
                {post.checkInLocation && (
                  <span className="text-xs font-medium text-muted-foreground ml-1">
                    is at <span className="text-foreground font-bold">{post.checkInLocation}</span>
                  </span>
                )}
                <GlobalUserBadges user={post.author} />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-accent uppercase tracking-wider">
                  <MapPin size={8} /> {post.author.location}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">• {post.timestamp}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground outline-none">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border w-56">
              {isOwner ? (
                <>
                  <DropdownMenuItem className="font-bold flex items-center gap-2 py-3 cursor-pointer">
                    <Edit size={14} /> Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deletePost(post.id)}
                    className="text-destructive font-bold flex items-center gap-2 py-3 cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem 
                    onClick={() => {
                      toggleSavePost(post.id);
                      toast({ title: post.isSaved ? "Removed from Saves" : "Post Saved" });
                    }}
                    className="font-bold flex items-center gap-2 py-3 cursor-pointer"
                  >
                    <Bookmark size={14} className={post.isSaved ? "fill-current text-accent" : ""} />
                    {post.isSaved ? "Unsave Post" : "Save Post"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => {
                      toggleFollowPost(post.id);
                      toast({ title: post.isFollowing ? "Unfollowed" : "Following Post" });
                    }}
                    className="font-bold flex items-center gap-2 py-3 cursor-pointer"
                  >
                    <Bell size={14} className={post.isFollowing ? "fill-current text-accent" : ""} />
                    {post.isFollowing ? "Following" : "Follow Discussion"}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-border/50" />
                  
                  <DropdownMenuItem className="font-bold flex items-center gap-2 py-3 cursor-pointer opacity-70">
                    <EyeOff size={14} /> See Less Like This
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => {
                      blockUser(post.author.username);
                      toast({ title: "User Blocked", description: `You won't see posts from @${post.author.username} anymore.` });
                    }}
                    className="text-destructive font-bold flex items-center gap-2 py-3 cursor-pointer"
                  >
                    <Ban size={14} /> Block @{post.author.username}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="font-bold flex items-center gap-2 py-3 cursor-pointer">
                    <AlertCircle size={14} /> Report to Admin
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="text-sm leading-relaxed text-foreground/90 font-bold whitespace-pre-wrap px-1">
          {displayedContent}
          {isLongText && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-accent hover:underline ml-1 font-bold text-xs"
            >
              {isExpanded ? "Show Less" : "Read More"}
            </button>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/10">
          <div className="flex items-center gap-1 sm:gap-4">
            <div className="flex items-center bg-muted/30 rounded-full p-1 border border-border/40 backdrop-blur-sm">
              <button 
                onClick={() => {
                  setInteraction(interaction === 'helpful' ? null : 'helpful');
                  interactPost(post.id, 'helpful');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold ${
                  interaction === 'helpful' ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20 scale-105' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <ThumbsUp size={13} />
                <span>{post.helpfulCount + (interaction === 'helpful' ? 1 : 0)}</span>
                <span className="hidden sm:inline ml-1 font-medium">Helpful</span>
              </button>
              <div className="w-[1px] h-3.5 bg-border/20 mx-0.5" />
              <button 
                onClick={() => {
                  setInteraction(interaction === 'not-helpful' ? null : 'not-helpful');
                  interactPost(post.id, 'not-helpful');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all text-[11px] font-bold ${
                  interaction === 'not-helpful' ? 'bg-destructive text-destructive-foreground scale-105' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/5'
                }`}
              >
                <ThumbsDown size={13} />
                <span>{post.notHelpfulCount + (interaction === 'not-helpful' ? 1 : 0)}</span>
              </button>
            </div>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold transition-all ${
                showComments ? 'text-accent bg-accent/5' : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
              }`}
            >
              <MessageSquare size={13} />
              <span>{post.comments.length}</span>
              <span className="hidden sm:inline font-medium">Comments</span>
            </button>
          </div>

          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold text-muted-foreground hover:text-accent hover:bg-accent/5 transition-all"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline font-medium">Share</span>
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-visible"
            >
              <div className="mt-4 pt-4 border-t border-border/10 space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-left">
                    <Avatar 
                      onClick={() => router.push(`/profile/${comment.author.username}`)}
                      className="w-7 h-7 shrink-0 cursor-pointer hover:ring-2 hover:ring-accent transition-all"
                    >
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback className="text-[10px] font-bold">{comment.author.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="bg-muted/30 rounded-2xl px-4 py-2.5 border border-border/20">
                         <div className="flex justify-between items-center mb-1">
                            <span 
                              onClick={() => router.push(`/profile/${comment.author.username}`)}
                              className="text-[11px] font-black cursor-pointer hover:text-accent hover:underline"
                            >
                              {comment.author.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase font-bold">{comment.timestamp}</span>
                         </div>
                         <p className="text-xs text-foreground/80 font-bold leading-relaxed">{comment.text}</p>
                      </div>
                      <div className="flex items-center gap-4 pl-2">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => likeComment(post.id, comment.id)}
                            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${comment.likedByMe ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
                          >
                            <ThumbsUp size={12} className={comment.likedByMe ? "fill-current" : ""} />
                            <span>{comment.likes}</span>
                          </button>
                          <button 
                            onClick={() => unlikeComment(post.id, comment.id)}
                            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors ${comment.unlikedByMe ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                          >
                            <ThumbsDown size={12} className={comment.unlikedByMe ? "fill-current" : ""} />
                            <span>{comment.unlikes}</span>
                          </button>
                        </div>
                        <button 
                          onClick={() => handleReplyToComment(comment.author.username)}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-accent transition-colors"
                        >
                          <span>REPLY</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-6 pb-2 px-1">
                  <form onSubmit={handleCommentSubmit} className="flex gap-3 items-center w-full">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={user?.profileImage} />
                      <AvatarFallback className="text-[10px] font-bold">YOU</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative group">
                      <Input 
                        ref={commentInputRef}
                        placeholder="Add a comment..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="bg-background border border-border/50 h-11 text-xs pr-12 focus:ring-accent font-bold w-full rounded-full px-5 shadow-sm transition-all group-hover:border-accent/40"
                      />
                      <button 
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-accent-foreground p-2 rounded-full hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal - Premium Brand Logos */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-background border-border p-6 rounded-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-center">Share Discussion</DialogTitle>
          </DialogHeader>
          
          <TooltipProvider delayDuration={0}>
            <div className="flex justify-between items-center px-2 py-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsRepostModalOpen(true)}
                    className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-all duration-300"
                  >
                    <Repeat size={22} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border-border font-bold text-[10px] uppercase">Repost</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => handleExternalShare('whatsapp')}
                    className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500/20 transition-all duration-300"
                  >
                    <WhatsAppLogo />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border-border font-bold text-[10px] uppercase">WhatsApp</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => handleExternalShare('fb')}
                    className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 hover:bg-blue-600/20 transition-all duration-300"
                  >
                    <FacebookLogo />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border-border font-bold text-[10px] uppercase">Facebook</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => handleExternalShare('messenger')}
                    className="w-12 h-12 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400 hover:bg-blue-400/20 transition-all duration-300"
                  >
                    <MessengerLogo />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border-border font-bold text-[10px] uppercase">Messenger</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleCopyLink}
                    className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  >
                    {isCopied ? <Check size={22} /> : <Copy size={22} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-popover border-border font-bold text-[10px] uppercase">{isCopied ? 'Copied!' : 'Copy Link'}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </DialogContent>
      </Dialog>

      {/* Repost Modal */}
      <Dialog open={isRepostModalOpen} onOpenChange={setIsRepostModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Repost discussion</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="flex items-center gap-3">
               <Avatar className="w-8 h-8">
                 <AvatarImage src={user?.profileImage} />
               </Avatar>
               <span className="text-sm font-bold">{user?.name}</span>
             </div>
             
             <Textarea 
               placeholder="Add your thoughts..." 
               value={repostCaption}
               onChange={(e) => setRepostCaption(e.target.value)}
               className="min-h-[100px] bg-muted/20 border-border/50 focus:ring-accent resize-none p-4 font-bold rounded-2xl"
             />
             
             <div className="bg-muted/40 border border-border/50 rounded-2xl p-4 opacity-70">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={post.author.avatar} />
                  </Avatar>
                  <span className="text-[10px] font-bold">@{post.author.username}</span>
                </div>
                <p className="text-xs font-bold line-clamp-2">{post.content}</p>
             </div>
          </div>
          
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setIsRepostModalOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button onClick={handleRepost} className="bg-accent text-accent-foreground rounded-xl px-10 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 transition-all duration-300 h-11">Repost Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
