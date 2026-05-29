import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type CheckStatus = "pass" | "fail" | "warn";

interface HealthCheck {
  name: string;
  status: CheckStatus;
  details: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function envSet(key: string): boolean {
  const val = process.env[key];
  return typeof val === "string" && val.trim().length > 0;
}

function statusIcon(status: CheckStatus) {
  if (status === "pass") return "✅";
  if (status === "warn") return "⚠️";
  return "❌";
}

function statusLabel(status: CheckStatus) {
  if (status === "pass") return "Pass";
  if (status === "warn") return "Warning";
  return "Fail";
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------
async function checkDatabase(): Promise<HealthCheck> {
  try {
    const count = await db.user.count();
    return {
      name: "Database Connection",
      status: "pass",
      details: `Connected — ${count.toLocaleString()} user${count !== 1 ? "s" : ""} in database`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      name: "Database Connection",
      status: "fail",
      details: `Connection failed: ${message}`,
    };
  }
}

function checkEnvVars(): HealthCheck {
  const required = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "SMTP_HOST",
    "UPSTASH_REDIS_REST_URL",
    "UPLOADTHING_SECRET",
  ];
  const missing = required.filter((k) => !envSet(k));

  if (missing.length === 0) {
    return {
      name: "Environment Variables",
      status: "pass",
      details: `All ${required.length} required variables are set`,
    };
  }

  return {
    name: "Environment Variables",
    status: "fail",
    details: `Missing: ${missing.join(", ")}`,
  };
}

function checkAuthConfig(): HealthCheck {
  const secret = process.env.AUTH_SECRET ?? "";
  if (!secret) {
    return {
      name: "Auth Configuration",
      status: "fail",
      details: "AUTH_SECRET is not set",
    };
  }
  if (secret.length < 32) {
    return {
      name: "Auth Configuration",
      status: "warn",
      details: `AUTH_SECRET is set but is only ${secret.length} characters (recommended ≥ 32)`,
    };
  }
  return {
    name: "Auth Configuration",
    status: "pass",
    details: `AUTH_SECRET is set and meets minimum length (${secret.length} chars)`,
  };
}

function checkEmailConfig(): HealthCheck {
  const smtpVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
  const missing = smtpVars.filter((k) => !envSet(k));

  if (missing.length === 0) {
    return {
      name: "Email Configuration",
      status: "pass",
      details: `All ${smtpVars.length} SMTP variables are set`,
    };
  }

  return {
    name: "Email Configuration",
    status: "fail",
    details: `Missing SMTP vars: ${missing.join(", ")}`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function HealthCheckPage() {
  // Server-side admin guard (belt-and-suspenders on top of middleware)
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.isAdmin) redirect("/dashboard?error=unauthorized");

  const [dbCheck, envCheck, authCheck, emailCheck] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkEnvVars()),
    Promise.resolve(checkAuthConfig()),
    Promise.resolve(checkEmailConfig()),
  ]);

  const checks: HealthCheck[] = [dbCheck, envCheck, authCheck, emailCheck];
  const allPassed = checks.every((c) => c.status === "pass");
  const hasFails = checks.some((c) => c.status === "fail");

  const overallStatus: CheckStatus = hasFails ? "fail" : allPassed ? "pass" : "warn";
  const checkedAt = new Date().toUTCString();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight">System Health Check</h1>
        <p className="text-muted-foreground mt-1 font-medium">
          This page is only visible to admins and should be used for post-deployment verification.
        </p>
      </div>

      {/* Overall banner */}
      <div
        className={[
          "flex items-center gap-4 rounded-2xl border p-5",
          overallStatus === "pass"
            ? "border-emerald-500/30 bg-emerald-500/10"
            : overallStatus === "warn"
              ? "border-amber-500/30 bg-amber-500/10"
              : "border-rose-500/30 bg-rose-500/10",
        ].join(" ")}
      >
        <span className="text-3xl" aria-hidden="true">
          {statusIcon(overallStatus)}
        </span>
        <div>
          <p
            className={[
              "text-lg font-bold",
              overallStatus === "pass"
                ? "text-emerald-400"
                : overallStatus === "warn"
                  ? "text-amber-400"
                  : "text-rose-400",
            ].join(" ")}
          >
            Overall:{" "}
            {overallStatus === "pass"
              ? "All systems operational"
              : overallStatus === "warn"
                ? "Degraded — warnings detected"
                : "Critical — one or more checks failed"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Checked at {checkedAt}</p>
        </div>
      </div>

      {/* Checks table */}
      <div className="rounded-2xl border border-border/50 bg-card/40 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Diagnostic Results
          </h2>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-48">
                Check
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-28">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {checks.map((check) => (
              <tr
                key={check.name}
                className="hover:bg-muted/10 transition-colors"
              >
                <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                  {check.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border",
                      check.status === "pass"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : check.status === "warn"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                    ].join(" ")}
                  >
                    {statusIcon(check.status)} {statusLabel(check.status)}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted-foreground font-medium">
                  {check.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground text-center">
        ⚠️ This page performs live database queries on every load. Do not expose it publicly or
        call it from automated monitoring — use a dedicated health endpoint for that.
      </p>
    </div>
  );
}
