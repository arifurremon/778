/**
 * Shared Tailwind classes for auth surfaces.
 * Colors come from --auth-* tokens in globals.css (same visual as legacy blue/slate).
 */
export const authStyles = {
  label: "text-sm font-bold text-auth-foreground tracking-wide uppercase",
  labelWithIcon:
    "flex items-center gap-2 font-bold text-sm text-auth-foreground uppercase tracking-wide",
  fieldIcon: "w-4 h-4 text-auth-brand",
  input:
    "h-12 px-5 rounded-2xl bg-white/70 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground placeholder:text-muted-foreground font-medium shadow-sm hover:border-border",
  inputWithToggle:
    "h-12 px-5 rounded-2xl bg-white/70 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground placeholder:text-muted-foreground font-medium shadow-sm hover:border-border pr-12",
  selectTrigger:
    "h-12 px-5 rounded-2xl bg-white/70 dark:bg-card/60 border-2 border-border/80 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground w-full text-left font-bold shadow-md hover:border-border text-base",
  selectContent: "bg-popover border border-border shadow-xl max-h-[400px]",
  selectItem: "cursor-pointer font-medium py-2",
  fieldIconOptional: "w-4 h-4 text-muted-foreground",
  tabFocus:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  buttonPrimary:
    "w-full h-12 mt-8 rounded-2xl bg-gradient-to-r from-auth-brand via-auth-brand to-auth-brand-deep hover:from-auth-brand-deep hover:via-auth-brand-deep hover:to-auth-brand-darker text-white font-bold text-base shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed tracking-wide uppercase",
  buttonSecondary:
    "w-full h-12 rounded-2xl bg-gradient-to-r from-auth-brand to-auth-brand-deep hover:from-auth-brand-deep hover:to-auth-brand-darker text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 uppercase tracking-wide",
  link: "text-auth-brand font-bold hover:text-auth-brand-deep transition-all hover:underline",
  linkSmall:
    "text-xs font-bold text-auth-brand hover:text-auth-brand-deep transition-colors hover:underline uppercase tracking-wider",
  heading: "text-2xl font-bold text-auth-foreground",
  passwordToggle:
    "absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-auth-brand/40 rounded-sm transition-colors",
} as const;
