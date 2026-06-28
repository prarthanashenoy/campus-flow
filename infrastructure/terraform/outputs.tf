output "frontend_url" {
  description = "CloudFront distribution URL for the frontend"
  value       = "https://${module.frontend.cloudfront_domain}"
}

output "backend_url" {
  description = "ALB DNS name for the backend API"
  value       = "https://${module.backend.alb_dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL — push backend images here"
  value       = module.backend.ecr_repository_url
}

output "db_endpoint" {
  description = "RDS endpoint (private, accessible only from within the VPC)"
  value       = module.database.endpoint
  sensitive   = true
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — used to invalidate the cache after a deploy"
  value       = module.frontend.cloudfront_distribution_id
}
