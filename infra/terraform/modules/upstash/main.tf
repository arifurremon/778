variable "database_name" { type = string }
variable "region" { type = string }

output "database_name" {
  value = var.database_name
}

output "setup_instructions" {
  value = <<-EOT
    Manual setup:
    1. Upstash Console → Create Redis database '${var.database_name}' in ${var.region}
    2. Copy REST URL + token to Vercel staging (UPSTASH_REDIS_REST_*)
  EOT
}
