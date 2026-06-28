variable "app_name"                 { type = string }
variable "environment"              { type = string }
variable "aws_region"               { type = string }
variable "backend_image"            { type = string }
variable "backend_cpu"              { type = number }
variable "backend_memory"           { type = number }
variable "backend_desired_count"    { type = number }
variable "vpc_id"                   { type = string }
variable "public_subnet_ids"        { type = list(string) }
variable "private_subnet_ids"       { type = list(string) }
variable "database_url_secret_arn"  { type = string }
variable "auth0_domain"             { type = string }
variable "auth0_audience"           { type = string }
variable "oso_cloud_api_key"        { type = string; sensitive = true }
variable "frontend_origin"          { type = string }
