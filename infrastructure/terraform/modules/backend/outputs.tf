output "alb_dns_name"           { value = aws_lb.backend.dns_name }
output "ecr_repository_url"     { value = aws_ecr_repository.backend.repository_url }
output "security_group_id"      { value = aws_security_group.ecs_tasks.id }
output "ecs_cluster_name"       { value = aws_ecs_cluster.main.name }
output "ecs_service_name"       { value = aws_ecs_service.backend.name }
output "github_deploy_role_arn" {
  value = length(aws_iam_role.github_deploy) > 0 ? aws_iam_role.github_deploy[0].arn : ""
}
