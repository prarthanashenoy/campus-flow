module "networking" {
  source = "./modules/networking"

  app_name           = var.app_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "database" {
  source = "./modules/database"

  app_name        = var.app_name
  environment     = var.environment
  db_instance_class = var.db_instance_class
  db_name         = var.db_name
  db_username     = var.db_username
  vpc_id          = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  backend_sg_id   = module.backend.security_group_id
}

module "backend" {
  source = "./modules/backend"

  app_name             = var.app_name
  environment          = var.environment
  aws_region           = var.aws_region
  backend_image        = var.backend_image
  backend_cpu          = var.backend_cpu
  backend_memory       = var.backend_memory
  backend_desired_count = var.backend_desired_count
  vpc_id               = module.networking.vpc_id
  public_subnet_ids    = module.networking.public_subnet_ids
  private_subnet_ids   = module.networking.private_subnet_ids
  database_url_secret_arn = module.database.database_url_secret_arn
  auth0_domain         = var.auth0_domain
  auth0_audience       = var.auth0_audience
  oso_cloud_api_key    = var.oso_cloud_api_key
  frontend_origin      = "https://${module.frontend.cloudfront_domain}"
}

module "frontend" {
  source = "./modules/frontend"

  app_name            = var.app_name
  environment         = var.environment
  backend_api_url     = "https://${module.backend.alb_dns_name}"
  frontend_domain     = var.frontend_domain
  acm_certificate_arn = var.acm_certificate_arn
}
