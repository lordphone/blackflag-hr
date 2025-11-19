# Project Summary

**Course:** CMPE-281  
**Topic:** Cloud Infrastructure for HR Platform

## Overview

This project establishes the AWS infrastructure required to host an enterprise HR application. Instead of manually clicking through the AWS Console, everything is defined in code (Terraform) to ensure reproducibility and stability.

## Technical Stack

*   **Infrastructure:** Terraform
*   **Compute:** AWS ECS (Fargate)
*   **Database:** AWS RDS (PostgreSQL)
*   **CDN/Static:** AWS CloudFront + S3
*   **App:** React (Frontend) + Python FastAPI (Backend)

## Key Features Implemented

1.  **Infrastructure as Code:** Complete environment setup via Terraform modules.
2.  **Containerization:** The backend API runs in Docker containers managed by ECS.
3.  **Secure Networking:** VPC design splits public (ALB, NAT) and private (DB, App) resources for security.
4.  **CI/CD Ready:** GitHub Actions workflows are set up for automated testing and deployment.
5.  **Monitoring:** CloudWatch dashboards and alarms are configured to track system health.

## Cost Estimate

Running this stack 24/7 in `us-west-2` costs approximately **$130/month**.
*   NAT Gateways and the Load Balancer are the biggest fixed costs.
*   For development, you can reduce this by removing the NAT Gateways or shutting down resources when not in use.

## Next Steps

With this foundation in place, the next phase is building out the actual application features:
*   Employee CRUD endpoints.
*   User authentication (Cognito integration).
*   Frontend dashboards for HR admins.
