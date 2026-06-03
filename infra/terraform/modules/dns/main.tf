variable "domain" { type = string }
variable "staging_subdomain" { type = string }
variable "vercel_cname_target" { type = string }

output "fqdn" {
  value = "${var.staging_subdomain}.${var.domain}"
}

output "dns_record" {
  value = {
    type  = "CNAME"
    name  = var.staging_subdomain
    value = var.vercel_cname_target
  }
}
