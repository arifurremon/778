"use client";

import { SiteFooter } from "@/components/legal/site-footer";
import Link from "next/link";
import { useEffect, useState } from "react";

type HealthPayload = {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  checks: {
    database: { status: string; latencyMs: number };
    redis: { status: string; latencyMs: number };
  };
};

const EXTERNAL_STATUS_URL =
  process.env.NEXT_PUBLIC_STATUS_PAGE_URL ?? "https://status.thechattala.com";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: "bg-green-100 text-green-800",
    pass: "bg-green-100 text-green-800",
    degraded: "bg-amber-100 text-amber-800",
    warn: "bg-amber-100 text-amber-800",
    unhealthy: "bg-red-100 text-red-800",
    fail: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        colors[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}

export default function StatusPageClient() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as HealthPayload;
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load live health data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadHealth();
    const interval = setInterval(loadHealth, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm text-muted-foreground">System Status</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">The Chattala Platform</h1>
        <p className="mt-3 text-muted-foreground">
          Live probe of core dependencies. For incident history and subscriber alerts, visit our{" "}
          <a href={EXTERNAL_STATUS_URL} className="underline" target="_blank" rel="noreferrer">
            public status page
          </a>
          .
        </p>

        <div className="mt-10 rounded-2xl border border-border/50 bg-card/30 p-6">
          {loading && <p className="text-sm text-muted-foreground">Checking services…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {health && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall</p>
                  <p className="text-xl font-semibold capitalize">{health.status}</p>
                </div>
                <StatusBadge status={health.status} />
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/40 p-4">
                  <dt className="text-sm text-muted-foreground">Database</dt>
                  <dd className="mt-2 flex items-center justify-between gap-2">
                    <StatusBadge status={health.checks.database.status} />
                    <span className="text-xs text-muted-foreground">
                      {health.checks.database.latencyMs} ms
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-border/40 p-4">
                  <dt className="text-sm text-muted-foreground">Redis Cache</dt>
                  <dd className="mt-2 flex items-center justify-between gap-2">
                    <StatusBadge status={health.checks.redis.status} />
                    <span className="text-xs text-muted-foreground">
                      {health.checks.redis.latencyMs} ms
                    </span>
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">
                Version {health.version} · Updated {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/" className="underline">
            Back to home
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
