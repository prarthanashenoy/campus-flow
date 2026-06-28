variable "app_name"            { type = string }
variable "environment"         { type = string }
variable "backend_api_url"     { type = string }
variable "frontend_domain"     { type = string; default = "" }
variable "acm_certificate_arn" { type = string; default = "" }
