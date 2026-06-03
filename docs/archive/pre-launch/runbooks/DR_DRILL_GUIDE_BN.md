# DR Drill গাইড (বাংলা) — Launch-এর আগে একবার করতে হবে

## RTO / RPO মানে কী?

| শব্দ | অর্থ | The Chattala target |
|------|------|---------------------|
| **RTO** (Recovery Time Objective) | Incident-এর পর সাইট আবার চালু হতে কত সময় লাগতে পারে | **< 4 ঘণ্টা** (Neon PITR) |
| **RPO** (Recovery Point Objective) | কত পুরনো ডেটা পর্যন্ত ফিরে যেতে হবে (কত ডেটা হারানো গ্রহণযোগ্য) | **≤ 24 ঘণ্টা** (Neon backup window) |

উদাহরণ: DB corrupt হলে গতকাল রাত ১০টার backup-এ restore করলে RPO = ~১ দিন।

---

## এই drill কেন?

Launch-এর আগে **কাগজে লেখা procedure** যথেষ্ট নয় — একবার হাতে চালিয়ে দেখতে হয়:

1. Neon backup থেকে restore করা যায় কিনা
2. Hosting-এ আগের deploy-এ ফিরে যাওয়া যায় কিনা
3. Restore-এর পর `/api/health` ও login কাজ করে কিনা

---

## কোনটা Cursor Agent এখনই করতে **পারে** vs **পারে না**

| কাজ | Agent পারে? | কারণ |
|-----|-------------|-------|
| Git revert rollback drill | ✅ হ্যাঁ | Repo-তে `git revert` simulation (≈31 ms measured) |
| DB smoke test (`SELECT 1`) | ✅ হ্যাঁ | `DATABASE_URL` থাকলে `npm run drill:smoke` |
| Integration tests after restore | ✅ হ্যাঁ | Restore branch URL দিলে |
| **Neon PITR branch তৈরি** | ❌ না | **Neon Console login** বা `NEON_API_KEY` দরকার |
| **Hosting rollback** | ❌ না | Vercel/hosting panel token দরকার (আপনার Vercel blocked) |

তাই Agent **পুরো drill একাই শেষ করতে পারে না** — Neon Console + hosting panel-এ **আপনার** ১৫–৩০ মিনিট লাগবে।

---

## আপনি যা করবেন (Step-by-step)

### A. Neon PITR Restore (≈20–45 min)

1. [console.neon.tech](https://console.neon.tech) → আপনার project
2. **Branches** → **Restore** → timestamp বেছে নিন (যেমন ১৫ মিনিট আগে)
3. Branch নাম: `recovery-YYYYMMDD-HHMM`
4. নতুন branch-এর connection string copy করুন
5. Terminal:

```bash
# Staging env-এ সাময়িকভাবে নতুন URL
export DATABASE_URL="postgresql://...recovery-branch..."
npm run drill:smoke
npx prisma migrate deploy
npm run test:integration
```

6. `GET /api/health` → `database: pass` নিশ্চিত করুন
7. RTO = restore শুরু → health green (ঘণ্টায় লিখুন)
8. RPO = restore timestamp vs incident time (ঘণ্টায় লিখুন)
9. `LAUNCH_READINESS_REPORT.md` → Phase 4 table আপডেট করুন

### B. Hosting Rollback (≈5–10 min)

Vercel blocked হলে যে host ব্যবহার করছেন (Railway, Render, VPS):

1. Staging-এ ছোট harmless change deploy করুন
2. Dashboard → **Promote previous deployment** / redeploy prior build
3. `/api/health` + login test
4. Rollback RTO = promote click → green health (লক্ষ্য **< 5 min**)

### C. Git revert (already validated in repo)

```bash
# Repo-তে measured: ~31 ms revert time (local)
git revert <bad-commit> && git push
```

---

## Automatable smoke script

```bash
npm run drill:smoke
```

Output JSON `artifacts/dr-drill-smoke.json`-এ save করতে:

```bash
npm run drill:smoke > artifacts/dr-drill-smoke.json
```

---

## LAUNCH_READINESS_REPORT আপডেট

Drill শেষে এই table পূরণ করুন (`LAUNCH_READINESS_REPORT.md`):

| Drill date | RTO | RPO | Notes |
|------------|-----|-----|-------|
| 2026-XX-XX | e.g. 35 min | e.g. 15 min | Neon branch `recovery-...` |

**গুরুত্বপূর্ণ:** Agent বা AI দিয়ে **কাল্পনিক** RTO/RPO লেখা যাবে না — শুধু আসল drill-এর সময় লিখুন।
