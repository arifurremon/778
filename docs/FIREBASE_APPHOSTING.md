# Firebase App Hosting — Legacy Reference

> **Phase 8.7** — Documents why `apphosting.yaml` exists while **Vercel is the primary host**.

---

## Summary

| Item | Status |
|------|--------|
| **Production host** | Vercel (`docs/DEPLOYMENT.md`) |
| **Staging host** | Vercel staging project (`docs/STAGING_ENVIRONMENT.md`) |
| **`apphosting.yaml`** | Legacy / unused — **do not deploy from this file** |
| **Decision record** | [ADR 005](./adr/005-vercel-primary-hosting.md) |

---

## History

During early prototyping, Firebase App Hosting was evaluated as an alternative to Vercel for Next.js deployment. The file `apphosting.yaml` at repo root configures Firebase backend scaling:

```yaml
runConfig:
  maxInstances: 10
```

No Firebase project is wired to this repository's CI/CD. All automated deploys use GitHub Actions + Vercel (see `.github/workflows/`).

---

## Why keep the file?

1. **Reference** for `maxInstances` if Firebase is re-evaluated.
2. **Avoid silent deletion** without team awareness — deprecation is explicit.
3. Removing it provides no production benefit (Vercel ignores it).

If the team decides to delete it later, update ADR 005 and remove this doc.

---

## If re-enabling Firebase (not recommended without ADR)

1. Create new ADR superseding ADR 005.
2. Configure Firebase project + GitHub integration separately from Vercel.
3. Do **not** run dual production URLs — choose one canonical domain.

---

## Related

- [Deployment Guide](./DEPLOYMENT.md)
- [Promotion Workflow](./PROMOTION_WORKFLOW.md)
