# AWS Infrastructure Architecture

> **Project:** BlackFlag HR  
> **Doc Version:** 1.0  
> **Last Updated:** November 2025

This document details the AWS infrastructure components that power the BlackFlag HR platform. For application-level design decisions, see [DESIGN.md](./DESIGN.md).

---

## 1. High-Level Infrastructure Diagram

```
                              ┌─────────────────────────────────────────────────────────────┐
                              │                        INTERNET                              │
                              └──────────────────────────┬──────────────────────────────────┘
                                                         │
                    ┌────────────────────────────────────┼────────────────────────────────────┐
                    │                                    │                                    │
           ┌────────▼────────┐                  ┌────────▼────────┐                          │
           │   CloudFront    │                  │   AWS WAF       │                          │
           │   Distribution  │                  │   (Layer 7)     │                          │
           └────────┬────────┘                  └────────┬────────┘                          │
                    │                                    │                                    │
           ┌────────▼────────┐                  ┌────────▼────────┐                          │
           │   S3 Bucket     │                  │   Application   │                          │
           │   (Frontend)    │                  │   Load Balancer │                          │
           └─────────────────┘                  │   (HTTPS/443)   │                          │
                                                └────────┬────────┘                          │
                                                         │                                    │
┌────────────────────────────────────────────────────────┼────────────────────────────────────┤
│ VPC: 10.0.0.0/16                                       │                                    │
│                                                        │                                    │
│  ┌─────────────────────────────────────────────────────┼─────────────────────────────────┐ │
│  │ PUBLIC SUBNETS                                      │                                 │ │
│  │                                                     │                                 │ │
│  │  ┌──────────────────┐              ┌──────────────────┐                              │ │
│  │  │ AZ-a: 10.0.0.0/24│              │ AZ-b: 10.0.1.0/24│                              │ │
│  │  │                  │              │                  │                              │ │
│  │  │  ┌────────────┐  │              │  ┌────────────┐  │                              │ │
│  │  │  │ NAT Gateway│  │              │  │ NAT Gateway│  │                              │ │
│  │  │  └─────┬──────┘  │              │  └─────┬──────┘  │                              │ │
│  │  └────────┼─────────┘              └────────┼─────────┘                              │ │
│  └───────────┼─────────────────────────────────┼─────────────────────────────────────────┘ │
│              │                                 │                                            │
│  ┌───────────┼─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │ PRIVATE SUBNETS                             │                                         │ │
│  │           │                                 │                                         │ │
│  │  ┌────────▼─────────┐              ┌────────▼─────────┐                              │ │
│  │  │ AZ-a: 10.0.10.0/24              │ AZ-b: 10.0.11.0/24                              │ │
│  │  │                  │              │                  │                              │ │
│  │  │  ┌────────────┐  │              │  ┌────────────┐  │       ┌──────────────────┐  │ │
│  │  │  │ ECS Task   │  │              │  │ ECS Task   │  │       │  RDS PostgreSQL  │  │ │
│  │  │  │ (Fargate)  │◄─┼──────────────┼──┤ (Fargate)  │  │──────▶│  (Multi-AZ)      │  │ │
│  │  │  └────────────┘  │              │  └────────────┘  │       └──────────────────┘  │ │
│  │  └──────────────────┘              └──────────────────┘                              │ │
│  └───────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Network Architecture

### 2.1. VPC Configuration

| Property | Value |
|----------|-------|
| **CIDR Block** | `10.0.0.0/16` (65,536 IPs) |
| **Region** | `us-west-2` |
| **Availability Zones** | 2 (for high availability) |
| **DNS Hostnames** | Enabled |
| **DNS Resolution** | Enabled |

### 2.2. Subnet Layout

| Subnet Type | AZ | CIDR | Purpose |
|-------------|-----|------|---------|
| Public | us-west-2a | `10.0.0.0/24` | ALB, NAT Gateway |
| Public | us-west-2b | `10.0.1.0/24` | ALB, NAT Gateway |
| Private | us-west-2a | `10.0.10.0/24` | ECS Tasks, RDS |
| Private | us-west-2b | `10.0.11.0/24` | ECS Tasks, RDS |

### 2.3. Route Tables

**Public Route Table:**
| Destination | Target |
|-------------|--------|
| `10.0.0.0/16` | Local |
| `0.0.0.0/0` | Internet Gateway |

**Private Route Table:**
| Destination | Target |
|-------------|--------|
| `10.0.0.0/16` | Local |
| `0.0.0.0/0` | NAT Gateway |

---

## 3. Security Groups

### 3.1. ALB Security Group

| Direction | Port | Protocol | Source | Description |
|-----------|------|----------|--------|-------------|
| Inbound | 443 | TCP | `0.0.0.0/0` | HTTPS traffic |
| Inbound | 80 | TCP | `0.0.0.0/0` | HTTP (redirects to HTTPS) |
| Outbound | All | All | ECS SG | To backend containers |

### 3.2. ECS Security Group

| Direction | Port | Protocol | Source | Description |
|-----------|------|----------|--------|-------------|
| Inbound | 8000 | TCP | ALB SG | From load balancer only |
| Outbound | 443 | TCP | `0.0.0.0/0` | AWS APIs, external services |
| Outbound | 5432 | TCP | RDS SG | Database access |

### 3.3. RDS Security Group

| Direction | Port | Protocol | Source | Description |
|-----------|------|----------|--------|-------------|
| Inbound | 5432 | TCP | ECS SG | PostgreSQL from app only |
| Outbound | None | - | - | No outbound required |

---

## 4. Compute: ECS Fargate

### 4.1. Cluster Configuration

| Property | Value |
|----------|-------|
| **Cluster Name** | `blackflag-hr-cluster` |
| **Launch Type** | Fargate (Serverless) |
| **Container Insights** | Enabled |

### 4.2. Service Configuration

| Property | Value |
|----------|-------|
| **Service Name** | `blackflag-hr-backend` |
| **Desired Count** | 2 (minimum for HA) |
| **Deployment Type** | Rolling Update |
| **Health Check Grace** | 60 seconds |

### 4.3. Task Definition

| Property | Value |
|----------|-------|
| **CPU** | 256 (0.25 vCPU) |
| **Memory** | 512 MB |
| **Platform** | Linux/ARM64 or Linux/AMD64 |
| **Network Mode** | awsvpc |

**Container Configuration:**
```json
{
  "name": "backend",
  "image": "${ECR_REPO}:latest",
  "portMappings": [{ "containerPort": 8000 }],
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/blackflag-hr",
      "awslogs-region": "us-west-2",
      "awslogs-stream-prefix": "backend"
    }
  },
  "secrets": [
    { "name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..." }
  ]
}
```

### 4.4. Auto-Scaling Policy

| Metric | Target | Scale Out | Scale In |
|--------|--------|-----------|----------|
| CPU Utilization | 70% | +1 task | -1 task |
| Memory Utilization | 80% | +1 task | -1 task |

**Limits:** Min 2 tasks, Max 10 tasks

---

## 5. Database: RDS PostgreSQL

### 5.1. Instance Configuration

| Property | Value |
|----------|-------|
| **Engine** | PostgreSQL 15.x |
| **Instance Class** | `db.t3.micro` (dev) / `db.t3.small` (prod) |
| **Storage** | 20 GB GP3, auto-scaling to 100 GB |
| **Multi-AZ** | Disabled (dev) / Enabled (prod) |

### 5.2. Security Configuration

| Property | Value |
|----------|-------|
| **Public Access** | Disabled |
| **Encryption at Rest** | AWS KMS |
| **SSL/TLS** | Required (`rds.force_ssl=1`) |
| **IAM Auth** | Optional |

### 5.3. Backup & Maintenance

| Property | Value |
|----------|-------|
| **Automated Backups** | 7-day retention |
| **Backup Window** | 03:00-04:00 UTC |
| **Maintenance Window** | Mon 04:00-05:00 UTC |
| **Deletion Protection** | Enabled (prod) |

---

## 6. Content Delivery: CloudFront + S3

### 6.1. S3 Bucket (Frontend)

| Property | Value |
|----------|-------|
| **Bucket Name** | `blackflag-hr-frontend-{env}` |
| **Versioning** | Enabled |
| **Public Access** | Blocked |
| **Encryption** | AES-256 (SSE-S3) |

### 6.2. CloudFront Distribution

| Property | Value |
|----------|-------|
| **Origin** | S3 Bucket (OAC) |
| **Price Class** | PriceClass_100 (NA/EU) |
| **HTTP Version** | HTTP/2 and HTTP/3 |
| **SSL Certificate** | ACM (custom domain) |

**Cache Behavior:**
| Path Pattern | TTL | Compression |
|--------------|-----|-------------|
| `index.html` | 0 (no-cache) | Gzip, Brotli |
| `*.js`, `*.css` | 31536000 (1 year) | Gzip, Brotli |
| `assets/*` | 86400 (1 day) | Gzip, Brotli |

**Error Pages:**
| Error Code | Response | TTL |
|------------|----------|-----|
| 403, 404 | `/index.html` (200) | 10s |

---

## 7. Load Balancer: ALB

### 7.1. Listener Configuration

| Port | Protocol | Action |
|------|----------|--------|
| 80 | HTTP | Redirect → HTTPS (301) |
| 443 | HTTPS | Forward → Target Group |

**HTTPS Listener:**
- **SSL Policy:** `ELBSecurityPolicy-TLS13-1-2-2021-06`
- **Certificate:** ACM-managed for custom domain

### 7.2. Target Group

| Property | Value |
|----------|-------|
| **Target Type** | IP (Fargate) |
| **Protocol** | HTTP |
| **Port** | 8000 |
| **Deregistration Delay** | 30 seconds |

**Health Check:**
| Property | Value |
|----------|-------|
| **Path** | `/health` |
| **Interval** | 30 seconds |
| **Timeout** | 5 seconds |
| **Healthy Threshold** | 2 |
| **Unhealthy Threshold** | 3 |

---

## 8. Security Services

### 8.1. AWS WAF

**Attached to:** Application Load Balancer

| Rule Group | Mode | Description |
|------------|------|-------------|
| AWSManagedRulesCommonRuleSet | Block | XSS, LFI, path traversal |
| AWSManagedRulesSQLiRuleSet | Block | SQL injection |
| AWSManagedRulesKnownBadInputsRuleSet | Block | Log4j, etc. |

### 8.2. AWS Secrets Manager

| Secret | Contents |
|--------|----------|
| `blackflag-hr/db-credentials` | `username`, `password`, `host`, `port` |
| `blackflag-hr/app-secrets` | `jwt_secret`, API keys |

**Rotation:** Automatic (30-day cycle via Lambda)

### 8.3. ACM (Certificate Manager)

| Domain | Status | Renewal |
|--------|--------|---------|
| `portal.blackflag.hr` | Issued | Automatic |
| `api.blackflag.hr` | Issued | Automatic |

---

## 9. Monitoring & Observability

### 9.1. CloudWatch Log Groups

| Log Group | Retention | Source |
|-----------|-----------|--------|
| `/ecs/blackflag-hr` | 14 days | ECS Tasks |
| `/rds/blackflag-hr` | 7 days | RDS PostgreSQL |
| `/waf/blackflag-hr` | 30 days | WAF Requests |

### 9.2. CloudWatch Alarms

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| ECS High CPU | `CPUUtilization` | > 80% for 5m | SNS → Slack |
| ECS High Memory | `MemoryUtilization` | > 85% for 5m | SNS → Slack |
| RDS High CPU | `CPUUtilization` | > 80% for 5m | SNS → Slack |
| RDS Low Storage | `FreeStorageSpace` | < 5 GB | SNS → Slack |
| ALB 5xx Errors | `HTTPCode_Target_5XX_Count` | > 10 in 5m | SNS → Slack |
| ALB Latency | `TargetResponseTime` | > 1s avg | SNS → Slack |
| Unhealthy Hosts | `UnHealthyHostCount` | > 0 | SNS → Slack |

### 9.3. CloudWatch Dashboard

**Widgets:**
- ECS CPU/Memory utilization (line chart)
- ALB request count & latency (stacked area)
- RDS connections & IOPS (line chart)
- Error rate (5xx) (number + sparkline)

---

## 10. Cost Optimization

### 10.1. Monthly Cost Estimate (us-west-2)

| Service | Configuration | Est. Cost |
|---------|---------------|-----------|
| ECS Fargate | 2 tasks × 0.25 vCPU, 512MB | ~$15 |
| RDS PostgreSQL | db.t3.micro, 20GB | ~$15 |
| NAT Gateway | 2 gateways | ~$65 |
| ALB | Standard | ~$20 |
| S3 + CloudFront | Low traffic | ~$5 |
| Secrets Manager | 2 secrets | ~$1 |
| CloudWatch | Logs + Alarms | ~$5 |
| **Total** | | **~$126/month** |

### 10.2. Cost Reduction Options

| Strategy | Savings | Trade-off |
|----------|---------|-----------|
| Single NAT Gateway | ~$32/mo | Reduced AZ redundancy |
| Spot Fargate | ~30-50% | Possible interruptions |
| Reserved RDS | ~30% | 1-year commitment |
| Scheduled scaling | Variable | Manual management |

---

## 11. Disaster Recovery

### 11.1. RPO/RTO Targets

| Metric | Development | Production |
|--------|-------------|------------|
| **RPO** (Data Loss) | 24 hours | 1 hour |
| **RTO** (Downtime) | 4 hours | 15 minutes |

### 11.2. Backup Strategy

| Component | Backup Method | Retention |
|-----------|---------------|-----------|
| RDS | Automated snapshots | 7 days |
| S3 Frontend | Versioning | 30 days |
| Terraform State | S3 + DynamoDB lock | Indefinite |
| Secrets | Cross-region replication | N/A |

### 11.3. Recovery Procedures

1. **ECS Failure:** Automatic task replacement (Fargate)
2. **RDS Failure:** Point-in-time restore or failover (Multi-AZ)
3. **Region Failure:** Terraform apply to secondary region (DR plan)

---

## References

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [ECS Best Practices Guide](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS PostgreSQL User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
