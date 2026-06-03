# Infrastructure as Code — The Chattala

> **Phase 8.3** — Terraform baseline for Neon, Upstash, DNS.  
> **Status:** Scaffold only — `terraform apply` requires cloud credentials (deferred to ops setup).

---

## Layout

```
infra/terraform/
├── README.md           ← this file
├── main.tf               ← root module wiring
├── variables.tf          ← input variables (no secrets committed)
├── outputs.tf            ← connection hints (non-sensitive)
├── terraform.tfvars.example
└── modules/
    ├── neon/             ← Neon branch documentation module
    ├── upstash/          ← Redis database module (REST)
    └── dns/              ← DNS record templates
```

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
- Neon API key (console → Account → API keys)
- Upstash account (optional — often created via console first)
- DNS provider API token (Cloudflare recommended)

---

## Quick start (when credentials available)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — NEVER commit this file

terraform init
terraform plan
terraform apply
```

Add `terraform.tfvars` to `.gitignore` if not already ignored.

---

## What is managed vs manual (current)

| Resource | IaC module | Notes |
|----------|------------|-------|
| Neon staging branch | `modules/neon` | Fork schema from production branch |
| Upstash Redis (staging) | `modules/upstash` | Separate from production |
| DNS `staging` CNAME | `modules/dns` | Points to Vercel staging |
| Vercel projects | **Manual** | Link repo branches in Vercel UI |
| Inngest apps | **Manual** | Sync `/api/inngest` per environment |
| GitHub secrets | **Manual** | See `docs/STAGING_ENVIRONMENT.md` |

---

## Provider notes

Neon and Upstash Terraform providers evolve quickly. This repo ships **documented placeholders** in `main.tf` so the team can pin provider versions when ready. Until then, use Neon Console + Upstash Console per `docs/STAGING_ENVIRONMENT.md`.

---

## Related

- [Staging Environment](../STAGING_ENVIRONMENT.md)
- [Capacity Planning](../CAPACITY_PLANNING.md)
- [Deferred Tasks](../DEFERRED_POST_COMPLETION_TASKS.md)
