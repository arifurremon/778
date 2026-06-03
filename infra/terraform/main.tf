terraform {
  required_version = ">= 1.5.0"

  # Uncomment when ready to apply — see infra/terraform/README.md
  # backend "remote" {
  #   organization = "inievo-technologies"
  #   workspaces { name = "thechattala-staging" }
  # }
}

# -----------------------------------------------------------------------------
# Provider placeholders — pin versions before first apply
# -----------------------------------------------------------------------------

# Neon: https://registry.terraform.io/providers/kisler/neon/latest
# Upstash: manage via console or community provider when adopted
# Cloudflare DNS: https://registry.terraform.io/providers/cloudflare/cloudflare/latest

module "neon_staging" {
  source = "./modules/neon"

  project_name   = var.neon_project_name
  staging_branch = var.neon_staging_branch_name
  region         = var.neon_region
}

module "upstash_staging" {
  source = "./modules/upstash"

  database_name = var.upstash_staging_database_name
  region        = var.upstash_region
}

module "dns_staging" {
  source = "./modules/dns"

  domain          = var.root_domain
  staging_subdomain = var.staging_subdomain
  vercel_cname_target = var.vercel_staging_cname
}
