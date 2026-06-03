# First 10 Real Users — Onboarding Playbook

> **When:** Immediately after **GO** sign-off ([GO_SIGNOFF_CHECKLIST.md](./GO_SIGNOFF_CHECKLIST.md))  
> **Goal:** 10 verified, engaged community members — not bots, not staging test accounts.

---

## Who to invite (ideal mix)

| # | Profile | Why |
|---|---------|-----|
| 1–3 | Trusted friends / colleagues in Chittagong | Fast feedback, forgiving of bugs |
| 2–3 | Local shop owners or service providers | Marketplace + directory validation |
| 2 | Active Facebook/community group members | Content + neighbour graph |
| 1–2 | Tech-savvy early adopters | Bug reports + UX feedback |

**Avoid:** mass public link, bots, accounts without real mobile numbers.

---

## Pre-invite setup (Day 0)

```bash
# 1. Confirm production is GO
DEPLOY_URL=https://www.thechattala.com npm run smoke:production

# 2. Apply pending migrations
npx prisma migrate deploy

# 3. Verify admin access
# Login as admin → /admin → users list loads
```

### Admin prep

- [ ] Seed 2–3 welcome posts (`/community`) — admin or staging content copied
- [ ] Verify `/directory` and `/emergency` have real data
- [ ] Set `registrationOpen: true` in admin settings (`/admin/settings`)
- [ ] Confirm email verification emails deliver (send test to yourself)

### Support channel

Pick one primary channel for first 10 users:

- [ ] WhatsApp group **or** Telegram **or** dedicated email `support@thechattala.com`
- [ ] Pin link: `https://www.thechattala.com/register`
- [ ] Prepare short invite message (BN + EN below)

---

## Invite message template

**English:**
> Hi! The Chattala — Chittagong's hyperlocal community platform — is opening to our first 10 members.  
> Register: https://www.thechattala.com/register  
> After signup, verify your email and post a short intro in Community.  
> Reply here if anything breaks — you're helping us launch!

**Bangla:**
> হ্যালো! The Chattala — চট্টগ্রামের হাইপারলোকাল কমিউনিটি প্ল্যাটফর্ম — প্রথম ১০ সদস্যের জন্য খুলছে।  
> রেজিস্টার: https://www.thechattala.com/register  
> সাইনআপের পর ইমেইল verify করে Community-তে একটা intro পোস্ট দিন।  
> কিছু ভাঙলে এখানে জানাবেন — আপনি লঞ্চে সাহায্য করছেন!

---

## Tracker — fill as users join

| # | Name | Invited | Registered | Email verified | First post | Neighbour connect | Notes |
|---|------|---------|------------|----------------|------------|-----------------|-------|
| 1 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 2 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 3 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 4 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 5 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 6 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 7 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 8 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 9 | | [ ] | [ ] | [ ] | [ ] | [ ] | |
| 10 | | [ ] | [ ] | [ ] | [ ] | [ ] | |

**Done when:** 10 rows have Registered ✅ and at least 7 have Email verified ✅.

---

## DB queries (Neon SQL editor)

```sql
-- Total registered users (non-deleted)
SELECT COUNT(*) AS total_users
FROM "User"
WHERE "deletedAt" IS NULL;

-- Users registered in last 7 days
SELECT id, email, username, "emailVerified", "createdAt"
FROM "User"
WHERE "deletedAt" IS NULL
ORDER BY "createdAt" DESC
LIMIT 20;

-- Email verification rate
SELECT
  COUNT(*) FILTER (WHERE "emailVerified" IS NOT NULL) AS verified,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE "emailVerified" IS NOT NULL) / NULLIF(COUNT(*), 0), 1) AS pct
FROM "User"
WHERE "deletedAt" IS NULL;

-- First-week posts
SELECT COUNT(*) AS posts_last_7d
FROM "Post"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
  AND "deletedAt" IS NULL;
```

---

## Day 1–7 watchlist

| Day | Action |
|-----|--------|
| **D0** | Send invites 1–5; monitor Sentry |
| **D1** | Send invites 6–10; check who verified email |
| **D2** | Personal follow-up to non-verified users |
| **D3** | Review first posts; moderate if needed |
| **D4** | Ask 2 users to try Neighbours or Directory |
| **D5** | Invite 1 seller or expert (optional) |
| **D6** | Run `DEPLOY_URL=... npm run smoke:production` |
| **D7** | Review `SUCCESS_METRICS.md` Tier 2; GO retrospective |

---

## Success criteria (first 10)

From `SUCCESS_METRICS.md` — scaled for soft launch:

| Metric | Target |
|--------|--------|
| Registered users | **≥ 10** |
| Email verified | **≥ 7** (70%) |
| At least 1 community post | **≥ 5 users** |
| P1 bugs from real users | **0** |
| Uptime | **≥ 99.9%** (72h window) |
| Sentry new issues/day | **< 10** |

---

## If something breaks

1. Check Sentry + Vercel function logs
2. Run smoke: `DEPLOY_URL=https://www.thechattala.com npm run smoke:production`
3. Rollback if P1: Vercel → Promote Previous Deployment
4. Tell invited users honestly — early access means fast fixes

See `docs/runbooks/` for Redis, Neon, SMTP failures.

---

## After first 10

- [ ] Collect feedback (5-min Google Form or WhatsApp poll)
- [ ] Update `LAUNCH_READINESS_REPORT.md` → note soft-launch complete
- [ ] Plan wider announcement (social, local groups) only after 72h green metrics
- [ ] Target 50 users by Week 4 (`SUCCESS_METRICS.md` Tier 3)
