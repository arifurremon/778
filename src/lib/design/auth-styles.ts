/**
 * Shared Tailwind classes for auth surfaces.
 * Colors come from --auth-* tokens in globals.css.
 */
export const authStyles = {
  /* Layout */
  pageShell: "relative min-h-screen flex flex-col overflow-hidden bg-auth-bg",
  pageInner:
    "relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12",
  cardShell:
    "w-full max-w-[1100px] mx-auto relative z-20 overflow-hidden rounded-[1.75rem] border border-[hsl(var(--auth-glass-border)/0.55)] dark:border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.25)] dark:shadow-black/50",
  cardGrid: "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] min-h-0",

  /* Brand panel (desktop left / mobile header) */
  brandPanel:
    "relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-auth-brand via-auth-brand-deep to-auth-brand-darker px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12 text-white",
  brandPanelOverlay:
    "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]",
  brandPanelGlow:
    "pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl",
  brandTagline: "mt-4 text-base sm:text-lg font-medium text-white/90 leading-relaxed max-w-sm",
  brandFeatureList: "mt-8 lg:mt-10 space-y-4",
  brandFeatureItem: "flex items-start gap-3",
  brandFeatureIcon:
    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20",
  brandFeatureTitle: "text-sm font-bold tracking-wide",
  brandFeatureDesc: "text-xs sm:text-sm text-white/75 leading-relaxed",
  brandStats:
    "mt-8 lg:mt-auto pt-6 border-t border-white/15 grid grid-cols-3 gap-3 text-center",
  brandStatValue: "text-lg sm:text-xl font-bold",
  brandStatLabel: "text-[10px] sm:text-xs uppercase tracking-wider text-white/65 font-semibold",

  /* Form panel */
  formPanel:
    "relative flex flex-col bg-gradient-to-br from-[hsl(var(--auth-glass-from)/0.98)] via-[hsl(var(--auth-glass-via)/0.96)] to-[hsl(var(--auth-glass-from)/0.98)] dark:from-[hsl(var(--auth-glass-from)/0.94)] dark:via-[hsl(var(--auth-glass-via)/0.9)] dark:to-[hsl(var(--auth-glass-from)/0.94)] backdrop-blur-2xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12",
  formPanelGlow:
    "pointer-events-none absolute top-0 right-0 h-56 w-56 rounded-full bg-auth-brand/10 blur-3xl",
  formHeader: "mb-6 lg:mb-8 space-y-1.5 text-center lg:text-left",
  formTitle: "text-2xl sm:text-[1.65rem] font-bold text-auth-foreground tracking-tight",
  formSubtitle: "text-sm text-muted-foreground font-medium",

  /* Tabs */
  tabGroup:
    "relative flex gap-1 p-1 rounded-2xl bg-[hsl(var(--auth-glass-tab)/0.85)] dark:bg-muted/40 border border-border/30 shadow-inner",
  tabButton:
    "relative flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  tabActive: "bg-card text-foreground shadow-md ring-1 ring-border/40",
  tabInactive: "text-muted-foreground hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5",

  /* Typography */
  label: "text-xs font-bold text-auth-foreground tracking-wide uppercase",
  labelWithIcon:
    "flex items-center gap-2 text-xs font-bold text-auth-foreground uppercase tracking-wide",
  fieldIcon: "w-3.5 h-3.5 text-auth-brand shrink-0",
  fieldIconOptional: "w-3.5 h-3.5 text-muted-foreground shrink-0",
  heading: "text-2xl font-bold text-auth-foreground tracking-tight",
  footerText: "text-sm text-muted-foreground font-medium",
  sectionTitle:
    "flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground",
  sectionLine: "h-px flex-1 bg-border/60",

  /* Inputs */
  inputGroup: "relative group",
  inputIcon:
    "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-auth-brand transition-colors",
  input:
    "h-11 sm:h-12 pl-4 pr-4 rounded-xl sm:rounded-2xl bg-white/75 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground placeholder:text-muted-foreground/80 font-medium shadow-sm hover:border-border",
  inputWithIcon:
    "h-11 sm:h-12 pl-11 pr-4 rounded-xl sm:rounded-2xl bg-white/75 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground placeholder:text-muted-foreground/80 font-medium shadow-sm hover:border-border",
  inputWithToggle:
    "h-11 sm:h-12 pl-4 pr-12 rounded-xl sm:rounded-2xl bg-white/75 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground placeholder:text-muted-foreground/80 font-medium shadow-sm hover:border-border",
  inputWithIconToggle:
    "h-11 sm:h-12 pl-11 pr-12 rounded-xl sm:rounded-2xl bg-white/75 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground placeholder:text-muted-foreground/80 font-medium shadow-sm hover:border-border",
  selectTrigger:
    "h-11 sm:h-12 px-4 rounded-xl sm:rounded-2xl bg-white/75 dark:bg-card/60 border border-border/60 focus:border-auth-brand focus:ring-2 focus:ring-auth-brand/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all text-foreground w-full text-left font-medium shadow-sm hover:border-border",
  selectContent: "bg-popover border border-border shadow-xl max-h-[400px] rounded-xl",
  selectItem: "cursor-pointer font-medium py-2.5 rounded-lg",
  passwordToggle:
    "absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-auth-brand/40 transition-colors",

  /* Buttons & links */
  buttonPrimary:
    "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-auth-brand via-auth-brand to-auth-brand-deep hover:from-auth-brand-deep hover:via-auth-brand-deep hover:to-auth-brand-darker text-white font-bold text-sm sm:text-base shadow-lg shadow-auth-brand/20 hover:shadow-xl hover:shadow-auth-brand/25 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed tracking-wide",
  buttonSecondary:
    "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-r from-auth-brand to-auth-brand-deep hover:from-auth-brand-deep hover:to-auth-brand-darker text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300",
  link: "text-auth-brand font-bold hover:text-auth-brand-deep transition-all hover:underline underline-offset-4",
  linkSmall:
    "text-xs font-bold text-auth-brand hover:text-auth-brand-deep transition-colors hover:underline uppercase tracking-wider underline-offset-4",
  googleButton:
    "w-full h-11 sm:h-12 rounded-xl sm:rounded-2xl border border-border/70 bg-white/85 dark:bg-card/70 font-semibold text-sm text-foreground shadow-sm hover:bg-white dark:hover:bg-card hover:border-border hover:shadow-md transition-all duration-200",

  /* Alerts & dividers */
  alertError:
    "flex items-start gap-3 rounded-xl sm:rounded-2xl bg-red-50/90 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/50 p-4 text-sm text-red-700 dark:text-red-300 backdrop-blur-sm",
  alertWarning:
    "rounded-xl sm:rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 p-4 text-sm text-amber-800 dark:text-amber-200 backdrop-blur-sm space-y-3",
  alertSuccessInline:
    "flex items-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2 text-xs font-semibold",
  dividerWrap: "relative py-1",
  dividerLine: "absolute inset-0 flex items-center",
  dividerBorder: "w-full border-t border-border/60",
  dividerLabel:
    "relative flex justify-center text-[11px] uppercase tracking-[0.16em] font-bold text-muted-foreground",
  dividerLabelBg:
    "bg-[hsl(var(--auth-glass-via)/0.96)] dark:bg-[hsl(var(--auth-glass-via)/0.9)] px-3",
  formSection: "space-y-4 rounded-2xl border border-border/40 bg-white/35 dark:bg-white/[0.03] p-4 sm:p-5",
  successCard:
    "flex flex-col items-center text-center space-y-6 py-4 sm:py-6",
  successIconWrap:
    "flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/40 border-4 border-green-200/80 dark:border-green-800/60 shadow-lg shadow-green-500/10",

  /* Legacy aliases */
  tabFocus:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-auth-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;
