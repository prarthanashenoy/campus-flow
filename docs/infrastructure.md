# CampusFlow Infrastructure

CampusFlow is deployed on AWS using Terraform. All infrastructure is defined as code in `infrastructure/terraform/`.

## Architecture

```
Internet
  ├─ CloudFront (CDN)
  │    └─ S3 (frontend static assets)
  │
  └─ ALB (HTTPS)
       └─ ECS Fargate (backend, private subnets)
            ├─ RDS PostgreSQL 16 (private subnets)
            └─ Secrets Manager (DATABASE_URL)
```

## Module Structure

```
infrastructure/terraform/
├── main.tf               # Provider and backend config
├── variables.tf          # All input variables
├── modules.tf            # Module instantiation
├── outputs.tf            # Root outputs
├── terraform.tfvars.example
└── modules/
    ├── networking/       # VPC, subnets, NAT gateways, route tables
    ├── database/         # RDS PostgreSQL, Secrets Manager, security group
    ├── backend/          # ECR, ECS cluster/service/task, ALB, IAM roles
    └── frontend/         # S3 bucket, CloudFront distribution, OAC
```

## Networking

- **VPC** — `/16` CIDR, two AZs
- **Public subnets** — ALB, NAT Gateways
- **Private subnets** — ECS tasks, RDS (never internet-accessible)
- **NAT Gateways** — one per AZ for high availability, allow private subnets to reach the internet (ECR pulls, Oso Cloud, Auth0)

## Frontend (S3 + CloudFront)

- Static Vite build deployed to an S3 bucket (private, no public access)
- CloudFront serves assets via Origin Access Control (OAC) — only CloudFront can read the bucket
- SPA routing: 403 and 404 responses are rewritten to `index.html` (React Router handles the path)
- Cache TTL: hashed assets → 1 year; `index.html` → 60 seconds
- Optional custom domain + ACM certificate

## Backend (ECS Fargate)

- Docker image built and pushed to ECR by CI/CD
- Fargate tasks run in private subnets (no public IP)
- ALB in public subnets with HTTP→HTTPS redirect
- Health check: `GET /api/health` must return 200
- Deployment circuit breaker: automatic rollback on failure
- CloudWatch Logs: structured JSON forwarded to `/ecs/<name>-backend`

## Database (RDS PostgreSQL 16)

- `db.t4g.micro` by default, upgradeable via `db_instance_class`
- Storage auto-scaling: 20 GB → 100 GB
- Encrypted at rest (`storage_encrypted = true`)
- Daily backups (7-day retention)
- `deletion_protection = true` — prevents accidental destruction
- Connection string stored in Secrets Manager and injected as `DATABASE_URL` at runtime

## IAM

- **ECS Task Execution Role** — pulls images from ECR, reads CloudWatch, reads Secrets Manager
- **ECS Task Role** — application-level permissions (currently none; add S3/SQS/etc. as needed)

## Deploying

### First time

```bash
cd infrastructure/terraform

# 1. Copy and fill in variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars

# 2. Initialise providers
terraform init

# 3. Review the plan
terraform plan

# 4. Apply
terraform apply
```

### Deploying a new backend version

```bash
# Build and push the image
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.eu-central-1.amazonaws.com

docker build -t campusflow-backend ./backend
docker tag campusflow-backend:latest <ecr_repository_url>:latest
docker push <ecr_repository_url>:latest

# Force a new ECS deployment
aws ecs update-service \
  --cluster campusflow-prod-cluster \
  --service campusflow-prod-backend-svc \
  --force-new-deployment
```

### Deploying a new frontend version

```bash
# Build the frontend
cd frontend && npm run build

# Sync to S3
aws s3 sync dist/ s3://<s3_bucket_name>/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <cloudfront_distribution_id> \
  --paths "/*"
```

## Remote State (recommended for teams)

Create an S3 bucket and DynamoDB table for state locking, then uncomment the `backend "s3"` block in `main.tf`:

```bash
aws s3api create-bucket \
  --bucket campusflow-terraform-state \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1

aws dynamodb create-table \
  --table-name campusflow-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```
