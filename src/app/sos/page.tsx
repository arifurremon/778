"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SOSRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/emergency");
  }, [router]);

  return null;
}
