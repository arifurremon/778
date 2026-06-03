import type { Metadata } from "next";
import StatusPageClient from "./status-page-client";

export const metadata: Metadata = {
  title: "System Status | The Chattala",
  description: "Live platform health for The Chattala core services.",
};

export default function StatusPage() {
  return <StatusPageClient />;
}
