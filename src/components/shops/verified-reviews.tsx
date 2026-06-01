"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, ShieldCheck, CornerDownRight, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useBusiness } from "@/hooks/use-business";
import { toast } from "@/hooks/use-toast";

interface VerifiedReviewsProps {
  productId: string;
  shopId: string;
  isOwner?: boolean;
}

export function VerifiedReviews({ productId, shopId, isOwner }: VerifiedReviewsProps) {
  const { user } = useAuth();
  const { reviews, addReview, addReply, orders, initializeBusiness } = useBusiness();

  useEffect(() => {
    initializeBusiness();
  }, [initializeBusiness]);

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const productReviews = reviews.filter(r => r.productId === productId);
  
  const canReview = !isOwner && orders.some(o => 
    o.productId === productId && 
    o.buyerEmail === user?.email && 
    o.status === 'Delivered'
  );

  const handlePostReview = () => {
    if (!comment.trim()) return;
    addReview({
      productId,
      userName: user?.name || "Guest",
      userEmail: user?.email || "",
      rating,
      comment,
    });
    setComment("");
    toast({ title: "Review Published", description: "Your feedback is now live." });
  };

  const handlePostReply = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return;
    addReply(reviewId, text);
    setReplyText({ ...replyText, [reviewId]: "" });
    toast({ title: "Reply Sent", description: "Your customer has been notified." });
  };

  return (
    <div className="space-y-10 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare size={20} className="text-accent" /> Customer Reviews
        </h3>
        <div className="flex items-center gap-1 text-accent font-bold">
           <Star size={16} className="fill-accent" /> {productReviews.length > 0 ? (productReviews.reduce((a, b) => a + b.rating, 0) / productReviews.length).toFixed(1) : "5.0"}
        </div>
      </div>

      {canReview && (
        <div className="bg-card/20 border border-border/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">Share your experience</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setRating(i)}>
                  <Star size={18} className={`${i <= rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>
          <Textarea 
            placeholder="What did you think of this product?"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="bg-background/50 border-border/50 min-h-[100px] resize-none focus:ring-accent font-bold"
          />
          <Button onClick={handlePostReview} className="w-full bg-accent text-accent-foreground font-bold rounded-xl h-11 uppercase text-xs">
            Post Verified Review
          </Button>
        </div>
      )}

      <div className="space-y-6">
        {productReviews.length === 0 ? (
          <div className="text-center py-10 opacity-40">
            <MessageSquare size={32} className="mx-auto mb-3" />
            <p className="text-sm font-bold">No reviews yet. Be the first to share!</p>
          </div>
        ) : (
          productReviews.map((review) => (
            <div key={review.id} className="space-y-4 border-b border-border/10 pb-6 last:border-0">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 border border-border/50">
                    <AvatarFallback className="font-bold">{review.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{review.userName}</span>
                      {review.isVerified && (
                        <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-tighter bg-accent/10 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">
                          <ShieldCheck size={8} /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={10} className={i <= review.rating ? 'text-accent fill-accent' : 'text-muted-foreground'} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{review.timestamp}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-11 font-bold">
                {review.comment}
              </p>

              {review.reply ? (
                <div className="ml-11 bg-primary/5 border-l-2 border-accent rounded-r-xl p-4 mt-4 space-y-1">
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-accent">
                      <CornerDownRight size={12} /> Seller Response
                   </div>
                   <p className="text-sm text-muted-foreground font-bold">
                     {review.reply}
                   </p>
                </div>
              ) : isOwner && (
                <div className="ml-11 mt-4 space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Reply to customer..." 
                      className="bg-card/20 border-border/30 h-9 text-xs font-bold"
                      value={replyText[review.id] || ""}
                      onChange={e => setReplyText({ ...replyText, [review.id]: e.target.value })}
                    />
                    <Button 
                      size="icon" 
                      onClick={() => handlePostReply(review.id)}
                      className="h-9 w-9 bg-accent hover:bg-accent/90 shrink-0"
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
