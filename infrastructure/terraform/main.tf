terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # Remote state — uncomment and fill in after creating the S3 bucket + DynamoDB table
  # backend "s3" {
  #   bucket         = "campusflow-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = var.aws_region
  #   dynamodb_table = "campusflow-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "campusflow"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
