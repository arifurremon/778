import Link from "next/link";

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
      </p>
    </footer>
  );
}
