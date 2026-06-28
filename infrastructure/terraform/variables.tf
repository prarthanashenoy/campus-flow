variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Deployment environment (prod, staging)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name prefix used in resource names"
  type        = string
  default     = "campusflow"
}

# ── Networking ───────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AZs to use (defaults to two zones in the chosen region)"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b"]
}

# ── Backend (ECS) ────────────────────────────────────────────────────────────

variable "backend_image" {
  description = "Docker image for the backend (e.g. 123456789.dkr.ecr.eu-central-1.amazonaws.com/campusflow-backend:latest)"
  type        = string
}

variable "backend_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Number of backend tasks to run"
  type        = number
  default     = 2
}

# ── Database (RDS) ───────────────────────────────────────────────────────────

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "campusflow"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "campusflow"
  sensitive   = true
}

# ── Auth0 ────────────────────────────────────────────────────────────────────

variable "auth0_domain" {
  description = "Auth0 tenant domain (e.g. your-tenant.auth0.com)"
  type        = string
}

variable "auth0_audience" {
  description = "Auth0 API audience"
  type        = string
}

# ── Oso Cloud ────────────────────────────────────────────────────────────────

variable "oso_cloud_api_key" {
  description = "Oso Cloud API key (leave empty to disable)"
  type        = string
  default     = ""
  sensitive   = true
}

# ── Frontend ─────────────────────────────────────────────────────────────────

variable "frontend_domain" {
  description = "Custom domain for the frontend (optional, e.g. campusflow.example.com)"
  type        = string
  default     = ""
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for the frontend domain (us-east-1 required for CloudFront)"
  type        = string
  default     = ""
}
