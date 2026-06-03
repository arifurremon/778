# Frontend UI System — The Chattala

Design tokens, shared components, and route patterns for consumer-facing UI.

## Design tokens

Defined in `src/app/globals.css` and extended in `tailwind.config.ts`:

| Token family | Usage |
|--------------|--------|
| `primary`, `accent`, `muted` | Logged-in app shell |
| `auth-*` | Login / register surfaces |
| `chart-*`, `sidebar-*` | Admin charts and sidebar primitive |
| `--auth-glass-*` | Auth glassmorphism (light + dark) |

Auth form class names: `src/lib/design/auth-styles.ts`

## Shared components

| Component | Path | Use when |
|-----------|------|----------|
| `PageHeader` | `src/components/ui/page-header.tsx` | Page title block (`size="hero"` on dashboard) |
| `AppEmptyState` | `src/components/ui/empty-state.tsx` | Empty lists / feeds |
| `PageHeaderSkeleton`, route loaders | `src/components/ui/page-loading.tsx` | `app/**/loading.tsx` |
| `GlobalLoader` | `src/components/ui/global-loader.tsx` | Session / auth bootstrap |

## Route loading

Consumer routes with `loading.tsx`: community, profile, shops, search, dashboard, activity, services, neighbours, emergency, settings, directory, about, messages.

## Accessibility

- Global `button` / `a` focus rings in `globals.css`
- Auth inputs: `focus-visible` ring + offset via `authStyles`
- `prefers-reduced-motion` reduces animation duration globally

### Manual checks (pre-release)

1. Tab through auth, dashboard search, and settings toggles
2. Run Lighthouse Accessibility on `/`, `/dashboard`, `/community`
3. Verify dark mode on auth + splash + settings

## Settings persistence

Notification toggles on `/settings` persist via `PATCH /api/user/profile` → `privacySettings` JSON keys (`pushNotifications`, `emailUpdates`, etc.). Theme uses `useTheme` (localStorage).

## Quality gate (CI)

- `npm run validate` — TypeScript + unit tests (106 tests including `app-settings`)
- `npm run lint` — requires ESLint config (not yet initialized in repo)

### Pre-release accessibility checklist

- [ ] Lighthouse Accessibility ≥ 90 on `/`, `/dashboard`, `/settings`
- [ ] Keyboard-only pass on auth tabs and settings switches
- [ ] Dark mode check on auth glass + splash
