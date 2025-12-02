# BlackFlag HR - Architecture & Design

> **Status:** MVP (Active Development)  
> **Doc Version:** 1.0  
> **Last Updated:** November 2025

---

## 1. High-Level Overview

BlackFlag HR is a secure, cloud-native Human Resources portal designed to demonstrate **Enterprise Security Compliance** in a modern DevOps environment.

Unlike traditional architectures that rely on heavy, self-hosted infrastructure (Jenkins, Vault servers), this project utilizes a **Serverless & Managed Services** approach on AWS. This reduces operational overhead while maintaining strict security controls (OWASP ASVS L1, SOC2 readiness).

---

## 2. Technology Stack (The "Lean" Stack)

| Component | Technology Selected | Justification |
| :--- | :--- | :--- |
| **Compute** | **AWS ECS (Fargate)** | Serverless containers remove the need for OS patching and SSH access management. |
| **Identity** | **AWS IAM Identity Center** | Native OIDC integration allows centralized user management without managing a separate AD server. |
| **Database** | **Amazon RDS (PostgreSQL)** | Managed backups, encryption-at-rest (KMS), and private networking out of the box. |
| **CI/CD** | **GitHub Actions** | Located alongside code; uses OIDC for AWS auth (removing long-lived access keys). |
| **Secrets** | **AWS Secrets Manager** | Eliminates `.env` files; programmatic access to DB credentials at runtime. |
| **Network** | **AWS ALB + WAF** | Handles TLS termination and blocks common attacks (SQLi, XSS) before they reach the app. |
| **Infra as Code** | **Terraform** | Declarative infrastructure management with state tracking and drift detection. |

---

## 3. Core Design Decisions

### 3.1. Identity & Access Management (IAM)

* **Authentication:** We use **OIDC (OpenID Connect)**. The Application Load Balancer (ALB) handles the initial authentication handshake with AWS IAM Identity Center before the request reaches the container.

* **Authorization:** Role-Based Access Control (RBAC) is enforced at the Application Layer.
    * *Mechanism:* The app decodes the JWT header `x-amzn-oidc-data` to read group memberships (e.g., `HR_Admins`).

* **Zero-Trust CI/CD:** We do **not** use AWS Access Keys (`AKIA...`) in GitHub. Instead, we use an **OIDC Trust Relationship**. GitHub Actions requests a temporary, 1-hour token from AWS to perform deployments.

### 3.2. Network Security

* **Private Isolation:** The App (ECS) and Database (RDS) reside in **Private Subnets**. They have no public IP addresses.

* **Ingress Control:** The *only* way into the network is through the Application Load Balancer (ALB) on Port 443.

* **Encryption:**
    * **In-Transit:** TLS 1.2+ is enforced on the ALB. HTTP requests are auto-redirected to HTTPS.
    * **At-Rest:** RDS volumes and S3 buckets are encrypted using AWS KMS keys.

### 3.3. Observability & Auditing

* **Logs:** The application writes structured JSON logs to `stdout`.

* **Collection:** AWS ECS Log Driver routes these logs directly to **Amazon CloudWatch**.

* **Compliance:** This provides an immutable audit trail of who accessed what data (e.g., `"Action": "READ_SALARY", "User": "alice@hr.com"`).

---

## 4. CI/CD Pipeline Flow (GitHub Actions)

Our pipeline implements a "Secure Supply Chain" workflow:

```
┌─────────┐   ┌───────────┐   ┌──────────────┐   ┌─────────┐   ┌──────────────┐   ┌─────────┐
│ Commit  │──▶│ Lint/Test │──▶│   Security   │──▶│  Build  │──▶│  Container   │──▶│ Deploy  │
│         │   │           │   │ Scan (SAST)  │   │         │   │  Scan (ECR)  │   │  (ECS)  │
└─────────┘   └───────────┘   └──────────────┘   └─────────┘   └──────────────┘   └─────────┘
```

1. **Commit:** Developer pushes code to `main`.
2. **Lint & Test:** Unit tests and code quality checks run.
3. **Security Scan (SAST):** **CodeQL** scans the codebase for vulnerabilities (SQL Injection, Hardcoded Secrets). *Pipeline halts if High/Critical issues found.*
4. **Build:** Docker image is built.
5. **Scan (Container):** Image is pushed to **Amazon ECR**, where "Scan on Push" checks for OS-level CVEs.
6. **Deploy:** The ECS Service is updated to pull the new image (Rolling Update).

---

## 5. Architectural Decision Records (ADR)

*Summary of major pivots during the design phase.*

### ADR-001: Switching from Jenkins to GitHub Actions

| | |
|---|---|
| **Context** | Managing a Jenkins server requires patching plugins and securing a persistent server. |
| **Decision** | Moved to GitHub Actions. |
| **Result** | Reduced attack surface (no Jenkins server to hack) and simplified authentication via OIDC. |

### ADR-002: Switching from Vault to AWS Secrets Manager

| | |
|---|---|
| **Context** | HashiCorp Vault is complex to unseal and maintain for a single app. |
| **Decision** | Adopted AWS Secrets Manager. |
| **Result** | Native integration with ECS; secrets are injected as environment variables or fetched via SDK at runtime. |

---

## 6. Extended Features & Roadmap (The "Extras")

*These features represent "Level 2" maturity. They will be implemented after the MVP is stable.*

### 6.1. Secure Document Repository (S3)

* **Goal:** Allow HR Admins to upload/retrieve sensitive PDFs (e.g., Offer Letters) without exposing them to the public internet.

* **Architecture:**
    * **Storage:** Amazon S3 Bucket with `BlockPublicAccess` enabled.
    * **Access Pattern:** The Application Server (ECS) generates a **Pre-signed URL** (valid for 5 minutes) using its IAM Role.
    * **Security:** The user never accesses the bucket directly; they only get a temporary link validated by the App's RBAC logic.

### 6.2. ChatOps & Audit Alerts

* **Goal:** Real-time visibility into deployment status and security events.

* **Architecture:**
    * **Notifications:** AWS SNS (Simple Notification Service) topics created for `DeploymentEvents` and `SecurityAlerts`.
    * **Integration:** **AWS Chatbot** subscribes to these SNS topics and forwards messages to a private Slack channel (`#ops-alerts`).
    * **Trigger:** GitHub Actions sends a "Job Status" payload to SNS upon completion.

### 6.3. "Break Glass" Rollback Mechanism

* **Goal:** Instant recovery if a bad code push breaks production.

* **Architecture:**
    * **Mechanism:** A specific GitHub Actions Workflow (`rollback.yml`) configured with a `workflow_dispatch` trigger.
    * **Function:** Accepts a `image_tag` input (e.g., `v1.0.2`). When triggered by an Admin, it bypasses the build/test phase and immediately forces ECS to update the service to the previous known-good Docker image.

### 6.4. Supply Chain Security (Branch Protections)

* **Goal:** Prevent unreviewed or insecure code from reaching the `main` branch.

* **Configuration (GitHub Settings):**
    * **Require Pull Request Reviews:** Minimum 1 approval required.
    * **Require Status Checks:** The `Test` and `CodeQL` jobs *must* pass before the "Merge" button becomes clickable.
    * **Lock Branch:** Direct pushes to `main` are disabled for all users, including Admins.

### 6.5. Automated Security Gates (WAF)

* **Goal:** Proactive defense against Layer 7 attacks.

* **Architecture:**
    * **Component:** AWS WAF (Web Application Firewall) attached to the ALB.
    * **Rulesets:** Enabled "AWS Managed Rules for SQL Database" (blocks SQLi) and "Common Rule Set" (blocks XSS/Generic exploits).

---

## 7. Application Data Model

### 7.1. Employee Entity

```
┌─────────────────────────────────────────┐
│               Employee                  │
├─────────────────────────────────────────┤
│ id              : UUID (PK)             │
│ employee_id     : VARCHAR(50) UNIQUE    │
│ email           : VARCHAR(255) UNIQUE   │
│ first_name      : VARCHAR(100)          │
│ last_name       : VARCHAR(100)          │
│ department      : VARCHAR(100)          │
│ position        : VARCHAR(100)          │
│ phone           : VARCHAR(20)           │
│ salary          : DECIMAL (RBAC-gated)  │
│ ssn             : VARCHAR(11) (masked)  │
│ manager_id      : UUID (FK → Employee)  │
│ is_active       : BOOLEAN               │
│ hire_date       : TIMESTAMP             │
│ created_at      : TIMESTAMP             │
│ updated_at      : TIMESTAMP             │
└─────────────────────────────────────────┘
```

### 7.2. RBAC Matrix

| Resource | Employee | HR Admin |
|----------|----------|----------|
| View Own Profile | Yes | Yes |
| View Directory (basic) | Yes | Yes |
| View Salary Fields | No | Yes |
| Edit Any Profile | No | Yes |
| Upload Documents | No | Yes |
| Access Audit Logs | No | Yes |

---

## 8. API Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/health` | Public | Health check |
| `GET` | `/api/v1/me` | Authenticated | Current user profile |
| `GET` | `/api/v1/employees` | Authenticated | Employee directory (filtered by role) |
| `GET` | `/api/v1/employees/:id` | Authenticated | Single employee (salary masked for non-admin) |
| `PUT` | `/api/v1/employees/:id` | HR Admin | Update employee |
| `POST` | `/api/v1/documents/upload` | HR Admin | Generate S3 presigned upload URL |
| `GET` | `/api/v1/documents/:id` | Owner/Admin | Generate S3 presigned download URL |

---

## References

* [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)
* [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)
* [GitHub Actions OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

