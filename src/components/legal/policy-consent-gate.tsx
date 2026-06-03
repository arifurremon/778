"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/lib/api";
import { CURRENT_POLICY_VERSION, userNeedsPolicyReconsent } from "@/lib/legal/policy";
import Link from "next/link";
import { useEffect, useState } from "react";

export function PolicyConsentGate() {
  const { user, isLoading, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) {
      setOpen(false);
      return;
    }

    const version = (user as { policyVersion?: string | null }).policyVersion;
    setOpen(userNeedsPolicyReconsent(version));
  }, [user, isLoading]);

  const acceptPolicies = async () => {
    setSubmitting(true);
    try {
      await api.post("/api/user/policy-accept");
      await refreshProfile();
      setOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Updated policies</DialogTitle>
          <DialogDescription>
            Our Terms of Service and Privacy Policy were updated (version{" "}
            {CURRENT_POLICY_VERSION}). Please review and accept to continue using The Chattala.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/terms" className="underline" target="_blank">
            Read Terms of Service
          </Link>
          <Link href="/privacy" className="underline" target="_blank">
            Read Privacy Policy
          </Link>
        </div>
        <DialogFooter>
          <Button onClick={acceptPolicies} disabled={submitting}>
            {submitting ? "Saving…" : "I accept the updated policies"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
