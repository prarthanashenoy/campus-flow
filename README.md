# CampusFlow

A student opportunities platform connecting students with campus events, internships, research positions, and volunteer opportunities.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL, Prisma
- **Auth**: Auth0
- **Authorization**: Oso Cloud
- **Infrastructure**: Terraform, AWS
- **Observability**: Structured logging (Splunk-compatible), Prometheus metrics, Grafana
- **CI/CD**: GitHub Actions

## Local Development

### Prerequisites

- Node.js 22+
- Docker and Docker Compose

### Setup

1. **Start PostgreSQL:**
   ```bash
   docker compose up -d
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run db:generate
   npm run start:dev
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend runs at http://localhost:3000 and the backend at http://localhost:4000.

### Health Check

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "...",
  "service": "campusflow-backend"
}
```

## Project Structure

```
campusflow/
├── frontend/         # React + TypeScript frontend
├── backend/          # NestJS + TypeScript backend
├── infrastructure/   # Terraform AWS infrastructure
├── docs/             # Documentation
├── .github/          # GitHub Actions workflows
└── docker-compose.yml
```

## Documentation

- [Architecture](docs/architecture.md) _(coming soon)_
- [API Reference](docs/api.md) _(coming soon)_
- [Security](docs/security.md) _(coming soon)_
- [Monitoring](docs/monitoring.md) _(coming soon)_
