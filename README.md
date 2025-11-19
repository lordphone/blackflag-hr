# AWS HR Platform Infrastructure

This repo contains the infrastructure and application code for an HR platform running on AWS. It uses Terraform for infrastructure, Python (FastAPI) for the backend, and React for the frontend.

The goal is to have a solid, production-ready foundation that supports the HR application we're building on top of it.

## Architecture

We're using a standard modern cloud stack:

*   **Frontend:** React SPA stored in S3 and served via CloudFront.
*   **Backend:** FastAPI running on ECS Fargate (containerized).
*   **Database:** RDS PostgreSQL.
*   **Networking:** VPC with public/private subnets. Private resources (DB, ECS tasks) sit behind a NAT Gateway.
*   **Load Balancing:** Application Load Balancer handling traffic for the API.
*   **Security:** Secrets Manager for config, standard Security Groups.

## Project Structure

*   `terraform/` - All the infrastructure code.
*   `backend/` - Python API.
*   `frontend/` - React application.
*   `scripts/` - Helper scripts to deploy or destroy everything.
*   `.github/` - CI/CD workflows.

## Getting Started

You have two options to deploy this:

1.  **The Script Way:** Run `./scripts/deploy.sh all` to spin up everything at once.
2.  **The Manual Way:** Go into `terraform/` to apply the infra, then build/push the docker image, then build/sync the frontend.

Check `QUICKSTART.md` for the fast track, or `docs/DEPLOYMENT.md` if you want the full step-by-step details.

## Configuration

Most settings are in `terraform/variables.tf`. You'll need to create a `terraform.tfvars` file in that directory to set your specific values (like database passwords or environment names) before deploying.

## Local Dev

*   **Backend:** Standard Python setup. `pip install -r requirements.txt` and run with `uvicorn`.
*   **Frontend:** Standard Vite setup. `npm install` and `npm run dev`.

## Future Work

This is the foundation. Next steps include adding the actual HR logic (employee management, auth, etc.) on top of this structure.
