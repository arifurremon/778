# Neon staging branch — documented placeholder (Phase 8.3)
#
# When Neon Terraform provider is adopted, replace null_resource with:
#   resource "neon_branch" "staging" { ... }

variable "project_name" {
  type = string
}

variable "staging_branch" {
  type = string
}

variable "region" {
  type = string
}

output "branch_name" {
  value = var.staging_branch
}

output "setup_instructions" {
  value = <<-EOT
    Manual setup (until provider wired):
    1. Neon Console → Branches → Create '${var.staging_branch}' from main
    2. Copy pooled + direct URLs to Vercel staging env
    3. Run: npx prisma migrate deploy && npm run seed:staging
  EOT
}
