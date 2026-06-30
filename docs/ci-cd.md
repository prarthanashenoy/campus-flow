# CampusFlow CI/CD

Two GitHub Actions workflows automate quality gates and deployment.

## Workflows

### `ci.yml` — Continuous Integration

**Triggers:** every push to `main`, every pull request targeting `main`

**Jobs:**

| Job | Steps |
|---|---|
| `backend` | Install deps → `prisma generate` → `prisma migrate deploy` → lint → typecheck → test |
| `frontend` | Install deps → lint → typecheck → `vite build` |

The backend job spins up a PostgreSQL 16 service container so Prisma can run migrations and generate the client. All external services (Auth0, Oso Cloud) are mocked in tests — no real credentials are needed in CI.

### `deploy.yml` — Continuous Deployment

**Trigger:** push to `main` (runs after every merge)

**Concurrency:** only one deploy runs at a time. A newer push cancels an in-progress deploy (`cancel-in-progress: true`).

**Jobs:**

| Job | Steps |
|---|---|
| `deploy-backend` | OIDC auth → ECR login → docker build + push → render ECS task definition → ECS deploy (waits for stability) |
| `deploy-frontend` | Install + build Vite app → OIDC auth → `aws s3 sync` (immutable cache for assets, 60 s for `index.html`) → CloudFront invalidation |

## Authentication — AWS OIDC (no long-lived keys)

GitHub Actions authenticates to AWS via OpenID Connect. No `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are stored in GitHub.

The OIDC trust is established by the `aws_iam_role.github_deploy` resource in `infrastructure/terraform/modules/backend/iam-github.tf`. After `terraform apply`, copy the `github_deploy_role_arn` output and set it as a GitHub secret.

**Prerequisites:**

1. Create the GitHub OIDC provider in AWS once per account:
   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
   ```
2. Set `github_repo = "your-org/campusflow"` in `terraform.tfvars` and run `terraform apply`.

## Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Source |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `terraform output github_deploy_role_arn` |
| `AWS_REGION` | e.g. `eu-central-1` |
| `ECR_REPOSITORY` | e.g. `campusflow-prod-backend` |
| `ECS_CLUSTER` | `terraform output -json \| jq -r '.ecs_cluster_name.value'` |
| `ECS_SERVICE` | ECS service name |
| `ECS_TASK_DEFINITION` | Task definition family name |
| `S3_BUCKET` | `terraform output s3_bucket_name` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `terraform output cloudfront_distribution_id` |
| `VITE_API_URL` | Backend ALB URL, e.g. `https://api.campusflow.example.com` |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience |

## Image Tagging

Each backend image is tagged with both the Git SHA (`github.sha`) and `latest`. ECS always deploys the SHA-tagged image so every deploy is reproducible and rollbacks are trivial.

## Cache Strategy

Frontend assets are uploaded with two cache policies:

| Path | `Cache-Control` | Rationale |
|---|---|---|
| All files except `index.html` | `public, max-age=31536000, immutable` | Vite content-hashes filenames |
| `index.html` | `public, max-age=60, must-revalidate` | Short TTL so new deploys propagate within 60 s |

A CloudFront invalidation (`/*`) is created on every deploy to clear the CDN cache immediately.
