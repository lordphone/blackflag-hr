# BlackFlag HR

A secure, cloud-native Human Resources management application with complete AWS infrastructure deployment.

## Overview

BlackFlag HR is a full-stack HR management system built with modern technologies and deployed on AWS. This project includes both the application code and the complete cloud infrastructure needed to run it in production.

The application features employee management, secure authentication, and a modern React-based interface, all running on a scalable AWS architecture.

## Key Features

### Application Features
- **Employee Management:** Complete CRUD operations for employee records
- **Secure Authentication:** User sign-in with session management
- **Modern UI:** Clean, responsive React interface with Tailwind CSS
- **REST API:** FastAPI backend with proper error handling

### Infrastructure Features
- **Infrastructure as Code:** Complete AWS environment setup via Terraform
- **Containerization:** Backend API runs in Docker containers on ECS Fargate
- **Secure Networking:** VPC with public/private subnet separation
- **CI/CD Pipeline:** GitHub Actions for automated deployment
- **Monitoring:** CloudWatch dashboards and alerts

## Cost Estimate

Running this stack 24/7 in `us-west-2` costs approximately **$130/month**.
- NAT Gateways and the Load Balancer are the biggest fixed costs
- For development, you can reduce this by removing the NAT Gateways or shutting down resources when not in use

## Documentation

| Document | Description |
|----------|-------------|
| **[Product Features](docs/FEATURES.md)** | Functional requirements, HR features by phase, UI specs |
| **[Design & Architecture](docs/DESIGN.md)** | Application design, security decisions, RBAC model |
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
├── backend/            # FastAPI application & API
│   ├── src/
│   │   ├── routes/     # Employee management endpoints
│   │   ├── models.py   # SQLAlchemy data models
│   │   └── main.py     # FastAPI app entry point
│   └── Dockerfile      # Container definition
├── frontend/           # React single-page application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages (SignIn, Dashboard)
│   │   └── services/   # API client functions
│   ├── index.html      # App entry point
│   └── package.json    # Frontend dependencies
├── terraform/          # AWS Infrastructure as Code
│   ├── vpc.tf          # Network configuration
│   ├── ecs.tf          # Container orchestration
│   ├── rds.tf          # Database setup
│   ├── alb.tf          # Load balancer
│   └── main.tf         # Core infrastructure
├── scripts/            # Deployment automation
├── .github/workflows/  # CI/CD pipeline definitions
└── docs/               # Project documentation
```

## Security Features

- **Authentication:** Secure sign-in with session management (ready for OIDC integration)
- **Authorization:** Role-Based Access Control framework (Employee vs HR Admin)
- **Network Security:** VPC isolation, WAF protection, TLS encryption
- **Secrets Management:** AWS Secrets Manager integration (no hardcoded credentials)
- **CI/CD Security:** OIDC federation for AWS access (no long-lived keys)
