variable "neon_project_name" {
  description = "Neon project name (existing production project)"
  type        = string
  default     = "thechattala"
}

variable "neon_staging_branch_name" {
  description = "Neon branch name for staging"
  type        = string
  default     = "staging"
}

variable "neon_region" {
  description = "Neon region (e.g. aws-ap-southeast-1)"
  type        = string
  default     = "aws-ap-southeast-1"
}

variable "upstash_staging_database_name" {
  description = "Upstash Redis database name for staging"
  type        = string
  default     = "thechattala-staging"
}

variable "upstash_region" {
  description = "Upstash region"
  type        = string
  default     = "ap-southeast-1"
}

variable "root_domain" {
  description = "Root domain"
  type        = string
  default     = "thechattala.com"
}

variable "staging_subdomain" {
  description = "Staging subdomain label"
  type        = string
  default     = "staging"
}

variable "vercel_staging_cname" {
  description = "Vercel staging CNAME target (from Vercel domain settings)"
  type        = string
  default     = "cname.vercel-dns.com"
}
