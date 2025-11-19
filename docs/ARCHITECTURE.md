# Architecture Documentation

This document provides detailed information about the cloud infrastructure architecture.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Internet                               │
└────────────────┬─────────────────────────┬──────────────────────┘
                 │                         │
                 │                         │
        ┌────────▼──────────┐    ┌────────▼──────────┐
        │   CloudFront CDN  │    │  Application LB   │
        │   (Frontend)      │    │   (Backend API)   │
        └────────┬──────────┘    └────────┬──────────┘
                 │                         │
                 │                         │
        ┌────────▼──────────┐    ┌────────▼──────────┐
        │   S3 Bucket       │    │   ECS Fargate     │
        │   (Static Files)  │    │   (Containers)    │
        └───────────────────┘    └────────┬──────────┘
                                           │
                                  ┌────────▼──────────┐
                                  │  RDS PostgreSQL   │
                                  │  (Database)       │
                                  └───────────────────┘
```

## 🌐 Network Architecture

### VPC Design

- **CIDR Block**: 10.0.0.0/16
- **Availability Zones**: 2 (for high availability)
- **Subnets**:
  - Public Subnets (2): 10.0.0.0/24, 10.0.1.0/24
  - Private Subnets (2): 10.0.10.0/24, 10.0.11.0/24

### Network Flow

1. **Public Subnets**:
   - Application Load Balancer
   - NAT Gateways
   - Internet Gateway access

2. **Private Subnets**:
   - ECS Fargate tasks
   - RDS database instances
   - No direct internet access (uses NAT Gateway for outbound)

### Security Groups

| Resource | Inbound Rules | Outbound Rules |
|----------|---------------|----------------|
| ALB | HTTP (80), HTTPS (443) from 0.0.0.0/0 | All to ECS tasks |
| ECS Tasks | Port 8000 from ALB | All to internet, RDS |
| RDS | PostgreSQL (5432) from ECS tasks | All to internet |

## 🔧 Component Details

### Frontend (S3 + CloudFront)

**Purpose**: Serve React single-page application globally with low latency

**Components**:
- S3 bucket for static files
- CloudFront distribution for CDN
- Origin Access Identity (OAI) for secure S3 access

**Features**:
- HTTPS only (redirect from HTTP)
- Gzip/Brotli compression
- Edge caching (TTL: 1 hour for assets, no-cache for index.html)
- Custom error pages for SPA routing
- Global edge locations

**URLs**:
- S3: `s3://hr-cloud-infra-dev-frontend-{random}/`
- CloudFront: `https://{distribution-id}.cloudfront.net`

### Backend (ECS Fargate)

**Purpose**: Run containerized Python FastAPI application

**Architecture**:
- **Cluster**: hr-cloud-infra-dev-cluster
- **Service**: hr-cloud-infra-dev-backend-service
- **Launch Type**: Fargate (serverless)
- **Task Definition**:
  - CPU: 256 (0.25 vCPU)
  - Memory: 512 MB
  - Container Port: 8000
  - Platform: linux/amd64

**Scaling**:
- Desired Count: 2 tasks
- Auto-scaling based on:
  - CPU utilization > 70%
  - Memory utilization > 80%
- Min: 2 tasks, Max: 10 tasks

**Container Image**:
- Stored in Amazon ECR
- Multi-stage Docker build
- Non-root user for security
- Health check endpoint: `/health`

**Environment Variables**:
- `ENVIRONMENT`: dev/staging/prod
- `DB_HOST`, `DB_PORT`, `DB_NAME`: Database connection
- `DB_USERNAME`, `DB_PASSWORD`: From Secrets Manager

### Database (RDS PostgreSQL)

**Purpose**: Persistent data storage for HR platform

**Configuration**:
- Engine: PostgreSQL 15.4
- Instance Class: db.t3.micro (can be upgraded)
- Storage: 20 GB GP3 (auto-scaling to 40 GB)
- Multi-AZ: Disabled (configurable for production)

**Backup**:
- Automated backups: 7-day retention
- Backup window: 03:00-04:00 UTC
- Maintenance window: Monday 04:00-05:00 UTC

**Security**:
- Encrypted at rest
- Private subnet placement
- Security group restricts access to ECS tasks only
- Credentials in Secrets Manager

**Monitoring**:
- Performance Insights enabled
- CloudWatch logs for PostgreSQL and upgrades

### Load Balancer (ALB)

**Purpose**: Distribute traffic to ECS tasks with health checks

**Configuration**:
- Type: Application Load Balancer
- Scheme: Internet-facing
- Subnets: Public subnets in both AZs
- Listeners:
  - HTTP (80): Forward to ECS target group
  - HTTPS (443): Can be configured with ACM certificate

**Target Group**:
- Protocol: HTTP
- Port: 8000
- Health Check:
  - Path: `/health`
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy threshold: 2
  - Unhealthy threshold: 3

**Features**:
- Connection draining: 30 seconds
- Cross-zone load balancing
- Access logs (can be enabled)

### Secrets Management

**AWS Secrets Manager** stores sensitive data:

1. **Database Credentials** (`hr-cloud-infra-dev-db-credentials`):
   - username
   - password
   - host
   - port
   - dbname
   - engine

2. **Application Secrets** (`hr-cloud-infra-dev-app-secrets`):
   - jwt_secret
   - api_key

**Access**:
- ECS task execution role has permission to read secrets
- Secrets are injected as environment variables at container runtime

## 📊 Monitoring Architecture

### CloudWatch Dashboard

Centralized dashboard showing:
- ECS CPU and Memory utilization
- RDS performance metrics
- ALB request count and response times
- CloudFront traffic and error rates

### CloudWatch Alarms

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| ECS High CPU | CPUUtilization | > 80% | SNS notification |
| ECS High Memory | MemoryUtilization | > 80% | SNS notification |
| RDS High CPU | CPUUtilization | > 80% | SNS notification |
| RDS Low Storage | FreeStorageSpace | < 5 GB | SNS notification |
| ALB High Response Time | TargetResponseTime | > 1 second | SNS notification |
| ALB Unhealthy Targets | UnHealthyHostCount | > 0 | SNS notification |
| Backend Errors | BackendErrors | > 10 in 5 min | SNS notification |

### Logging

**ECS Logs**:
- Log Group: `/ecs/hr-cloud-infra-dev-backend`
- Retention: 7 days
- Format: JSON structured logs

**RDS Logs**:
- PostgreSQL logs
- Upgrade logs
- Exported to CloudWatch

**Log Metric Filters**:
- Backend errors: Track ERROR level logs
- Trigger alarms when error count exceeds threshold

### SNS Notifications

- Topic: `hr-cloud-infra-dev-alerts`
- Email subscription for alert notifications
- Receives alarms from all CloudWatch alarms

## 🔒 Security Architecture

### Network Security

1. **VPC Isolation**:
   - Private subnets for backend and database
   - No direct internet access
   - NAT Gateway for outbound traffic

2. **Security Groups**:
   - Principle of least privilege
   - Only required ports open
   - Source-restricted rules

3. **Network ACLs**:
   - Default VPC NACLs (allow all by default)
   - Can be customized for additional security

### Data Security

1. **Encryption at Rest**:
   - RDS encrypted with AWS KMS
   - S3 server-side encryption (AES256)
   - EBS volumes encrypted

2. **Encryption in Transit**:
   - HTTPS for CloudFront
   - TLS for database connections
   - HTTPS for ALB (when configured)

3. **Secrets Management**:
   - No hardcoded credentials
   - Secrets Manager for sensitive data
   - IAM roles for access control

### Access Control

1. **IAM Roles**:
   - ECS Task Execution Role: Pull images, read secrets
   - ECS Task Role: Application permissions
   - Principle of least privilege

2. **S3 Bucket Policy**:
   - Only CloudFront OAI can access
   - Public access blocked

3. **Database Access**:
   - Only from ECS security group
   - No public accessibility

## 🚀 Scalability

### Horizontal Scaling

1. **ECS Auto-scaling**:
   - Scales based on CPU/Memory
   - Adds/removes tasks automatically
   - Range: 2-10 tasks

2. **ALB**:
   - Automatically scales to handle traffic
   - No manual intervention required

3. **RDS Read Replicas** (can be added):
   - Offload read queries
   - Improve performance

### Vertical Scaling

1. **ECS Task Size**:
   - Increase CPU/Memory in task definition
   - Zero-downtime deployment

2. **RDS Instance Class**:
   - Upgrade to larger instance
   - Minimal downtime (Multi-AZ: ~1-2 minutes)

3. **RDS Storage**:
   - Auto-scaling enabled
   - Grows as needed

## 🔄 High Availability

### Multi-AZ Deployment

- ALB spans 2 availability zones
- ECS tasks distributed across AZs
- RDS Multi-AZ available (production setting)

### Fault Tolerance

1. **ECS**:
   - Multiple tasks running
   - Task failure triggers replacement
   - Health checks detect unhealthy tasks

2. **RDS**:
   - Automated backups (7 days)
   - Point-in-time recovery
   - Multi-AZ for automatic failover (optional)

3. **CloudFront**:
   - Global edge network
   - Automatic failover
   - Origin shield (can be enabled)

## 💰 Cost Optimization

### Current Cost Estimates (us-west-2)

| Service | Configuration | Estimated Monthly Cost |
|---------|---------------|------------------------|
| ECS Fargate | 2 tasks (0.25 vCPU, 512MB) | ~$15 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| NAT Gateway | 2 gateways | ~$65 |
| ALB | Standard | ~$20 |
| S3 + CloudFront | Low traffic | ~$5 |
| Data Transfer | Moderate | ~$10 |
| **Total** | | **~$130/month** |

### Cost Optimization Tips

1. **Development Environment**:
   - Use single NAT Gateway instead of 2
   - Stop non-production resources when not in use
   - Use db.t3.micro for RDS

2. **Production Optimizations**:
   - Reserved instances for RDS
   - S3 Intelligent-Tiering
   - CloudFront cost class selection
   - VPC endpoints for S3 (already included)

3. **Monitoring**:
   - Set up AWS Budgets
   - Cost anomaly detection
   - Regular cost reviews

## 📈 Future Enhancements

### Phase 2: HR Platform Features

- Employee management CRUD
- User authentication (Cognito)
- Role-based access control
- Document storage (S3)
- Email notifications (SES)

### Phase 3: Advanced Features

- ElastiCache for Redis (caching)
- SQS for async processing
- Lambda functions for serverless tasks
- Step Functions for workflows
- Elasticsearch for search

### Phase 4: Enterprise Features

- Multi-region deployment
- Disaster recovery plan
- Advanced WAF rules
- DDoS protection (Shield)
- Compliance (HIPAA, SOC 2)

## 📚 References

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices.html)



