# BlackFlag HR

A secure, cloud-native Human Resources portal demonstrating enterprise security compliance on AWS.

## Overview

This project establishes the AWS infrastructure required to host an enterprise HR application. Instead of manually clicking through the AWS Console, everything is defined in code (Terraform) to ensure reproducibility and stability.

## Key Features

1. **Infrastructure as Code:** Complete environment setup via Terraform modules
2. **Containerization:** The backend API runs in Docker containers managed by ECS
3. **Secure Networking:** VPC design splits public (ALB, NAT) and private (DB, App) resources for security
4. **CI/CD Ready:** GitHub Actions workflows are set up for automated testing and deployment
5. **Monitoring:** CloudWatch dashboards and alarms are configured to track system health

## Cost Estimate

Running this stack 24/7 in `us-west-2` costs approximately **$130/month**.
- NAT Gateways and the Load Balancer are the biggest fixed costs
- For development, you can reduce this by removing the NAT Gateways or shutting down resources when not in use

## Documentation

| Document | Description |
|----------|-------------|
| **[Design & Architecture](docs/DESIGN.md)** | Application design, security decisions, RBAC model, and feature roadmap |
| **[AWS Infrastructure](docs/ARCHITECTURE.md)** | VPC topology, ECS/RDS configuration, security groups, and cost analysis |
| **[Deployment Guide](docs/DEPLOYMENT.md)** | Comprehensive deployment instructions and CI/CD setup |

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  CloudFront  │     │   AWS WAF    │     │     ALB      │     │  ECS Fargate │
│  (Frontend)  │     │  (Layer 7)   │────▶│   (HTTPS)    │────▶│  (Backend)   │
└──────┬───────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
       │                                                               │
       ▼                                                               ▼
┌──────────────┐                                               ┌──────────────┐
│  S3 Bucket   │                                               │     RDS      │
│ (Static SPA) │                                               │ (PostgreSQL) │
└──────────────┘                                               └──────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Python 3.11, FastAPI |
| **Database** | PostgreSQL 15 (RDS) |
| **Infrastructure** | Terraform |
| **CI/CD** | GitHub Actions |
| **Cloud** | AWS (ECS, RDS, S3, CloudFront, WAF, ALB) |

### Deploy

See **[Deployment Guide](docs/DEPLOYMENT.md)** for detailed step-by-step instructions.

## Project Structure

```
├── backend/            # FastAPI application
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── models.py   # SQLAlchemy models
│   │   └── main.py     # App entry point
│   └── Dockerfile
├── frontend/           # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── terraform/          # Infrastructure as Code
│   ├── vpc.tf
│   ├── ecs.tf
│   ├── rds.tf
│   ├── alb.tf
│   └── ...
├── .github/workflows/  # CI/CD pipelines
└── docs/               # Documentation
```

## Security Features

- **Authentication:** OIDC with AWS IAM Identity Center
- **Authorization:** Role-Based Access Control (Employee vs HR Admin)
- **Network:** Private subnets, WAF, TLS 1.3
- **Secrets:** AWS Secrets Manager (no `.env` files)
- **CI/CD:** OIDC federation (no long-lived AWS keys)
