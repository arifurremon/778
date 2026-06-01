"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useState } from "react";

export default function DeleteAccountPage() {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.del("/api/user/delete-account");

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      
      // Sign out and redirect
      await signOut({ callbackUrl: "/" });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive"
      });
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Danger Zone</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage irreversible account actions</p>
        </div>
      </div>

      <div className="bg-destructive/5 border border-destructive/20 rounded-[2.5rem] p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={32} />
          </div>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black tracking-tight text-destructive">Delete Account</h2>
              <p className="text-sm font-bold text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                Once you delete your account, there is no going back. Please be certain. 
                Your personal data will be erased, but your public contributions will remain anonymously to preserve community history.
              </p>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="rounded-xl font-black uppercase text-[11px] tracking-widest h-12 px-8">
                  <Trash2 size={16} className="mr-2" /> Delete My Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 sm:max-w-[425px] rounded-[2.5rem] shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-tight text-destructive">Are you absolutely sure?</DialogTitle>
                  <DialogDescription className="text-sm font-bold mt-2">
                    This action cannot be undone. This will permanently delete your account
                    and remove your personal data from our servers.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl font-black uppercase text-[11px] tracking-widest"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={loading}
                    className="rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-destructive/20"
                  >
                    {loading ? "Deleting..." : "Yes, delete account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
