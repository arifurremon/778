import Link from "next/link";

const STATUS_PAGE_HREF = process.env.NEXT_PUBLIC_STATUS_PAGE_URL ?? "/status";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/80 py-6 text-center text-sm text-muted-foreground">
      <p>
        © {new Date().getFullYear()} The Chattala ·{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy
        </Link>
        {" · "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms
        </Link>
        {" · "}
        <Link href={STATUS_PAGE_HREF} className="underline hover:text-foreground">
          Status
        </Link>
      </p>
    </footer>
  );
}
