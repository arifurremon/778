output "neon_staging_branch" {
  description = "Neon staging branch name"
  value       = module.neon_staging.branch_name
}

output "upstash_staging_name" {
  description = "Upstash staging database name"
  value       = module.upstash_staging.database_name
}

output "staging_fqdn" {
  description = "Fully qualified staging hostname"
  value       = module.dns_staging.fqdn
}
