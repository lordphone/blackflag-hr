# HR Cloud Infrastructure Project

A comprehensive cloud-native HR platform featuring a React frontend, FastAPI backend, and fully automated AWS infrastructure using Terraform.

## 📚 Documentation

*   **[Design Document](docs/DESIGN.md)**: Explanation of design choices, infrastructure diagrams, and sequence flows.
*   **[Architecture Details](docs/ARCHITECTURE.md)**: Deep dive into the AWS components, network topology, and security.
*   **[Deployment Guide](docs/DEPLOYMENT.md)**: Step-by-step instructions to deploy this project to your AWS account.
*   **[Project Summary](PROJECT_SUMMARY.md)**: High-level overview of the tech stack and costs.

## 🚀 Quick Start

1.  **Clone the repo**:
    ```bash
    git clone <repository-url>
    cd final-project
    ```

2.  **Deploy Infrastructure**:
    ```bash
    cd terraform
    cp terraform.tfvars.example terraform.tfvars
    # Edit terraform.tfvars with your settings
    terraform init
    terraform apply
    ```

3.  **Deploy Applications**:
    Follow the detailed steps in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) to build and push the Docker images and deploy the frontend.

## 🏗️ Architecture

This project uses a modern, serverless-first architecture:
*   **Frontend**: React SPA hosted on S3 + CloudFront.
*   **Backend**: Python FastAPI running on AWS ECS Fargate.
*   **Database**: Managed PostgreSQL (RDS) in private subnets.
*   **Networking**: VPC with public/private isolation and Application Load Balancer.

## 🛠️ Tech Stack

*   **Infrastructure**: Terraform (HCL)
*   **Backend**: Python 3.11, FastAPI, Docker
*   **Frontend**: TypeScript, React, Vite
*   **Cloud Provider**: AWS (ECS, RDS, S3, CloudFront, VPC)

---
*Created for CMPE-281 Cloud Technologies*
