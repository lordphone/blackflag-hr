# Deployment Guide

This guide provides step-by-step instructions for deploying the AWS cloud infrastructure and applications.

## 📋 Prerequisites

Before starting, ensure you have:

- **AWS Account** with appropriate permissions (EC2, ECS, RDS, S3, CloudFront, IAM, etc.)
- **AWS CLI** installed and configured (`aws configure`)
- **Terraform** >= 1.5.0 ([Install Terraform](https://www.terraform.io/downloads))
- **Docker** installed ([Install Docker](https://docs.docker.com/get-docker/))
- **Node.js** >= 18.x ([Install Node.js](https://nodejs.org/))
- **Python** >= 3.11 ([Install Python](https://www.python.org/downloads/))
- **Git** for version control

### AWS Permissions Required

Your AWS user/role needs the following permissions:
- EC2, VPC, and networking
- ECS and ECR
- RDS
- S3 and CloudFront
- Application Load Balancer
- IAM (for creating roles)
- Secrets Manager
- CloudWatch and SNS

## 🚀 Deployment Steps

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd final-project
```

### Step 2: Configure Terraform Variables

1. Navigate to the terraform directory:
   ```bash
   cd terraform
   ```

2. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Edit `terraform.tfvars` with your values:
   ```hcl
   aws_region = "us-west-2"
   project_name = "hr-cloud-infra"
   environment = "dev"
   
   # Database
   db_username = "dbadmin"
   
   # Monitoring
   alert_email = "your-email@example.com"
   
   # Production settings (optional)
   enable_deletion_protection = false
   enable_multi_az = false
   ```

### Step 3: Deploy Infrastructure with Terraform

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Review the execution plan:
   ```bash
   terraform plan
   ```

3. Apply the infrastructure:
   ```bash
   terraform apply
   ```
   
   Type `yes` when prompted.

4. Save the outputs:
   ```bash
   terraform output > ../terraform-outputs.txt
   ```

**⏱️ Deployment time: ~10-15 minutes**

The infrastructure includes:
- VPC with public/private subnets
- NAT Gateways
- RDS PostgreSQL database
- ECS Fargate cluster
- Application Load Balancer
- S3 bucket and CloudFront distribution
- Secrets Manager secrets
- CloudWatch alarms and SNS topic

### Step 4: Build and Deploy Backend

1. Navigate to backend directory:
   ```bash
   cd ../backend
   ```

2. Get ECR repository URL from Terraform outputs:
   ```bash
   ECR_URL=$(terraform output -raw ecr_repository_url -state=../terraform/terraform.tfstate)
   echo $ECR_URL
   ```

3. Login to ECR:
   ```bash
   aws ecr get-login-password --region us-west-2 | \
     docker login --username AWS --password-stdin $ECR_URL
   ```

4. Build Docker image for linux/amd64:
   ```bash
   docker build --platform linux/amd64 -t $ECR_URL:latest .
   ```

5. Push to ECR:
   ```bash
   docker push $ECR_URL:latest
   ```

6. Force ECS to deploy the new image:
   ```bash
   aws ecs update-service \
     --cluster hr-cloud-infra-dev-cluster \
     --service hr-cloud-infra-dev-backend-service \
     --force-new-deployment \
     --region us-west-2
   ```

7. Wait for deployment to complete:
   ```bash
   aws ecs wait services-stable \
     --cluster hr-cloud-infra-dev-cluster \
     --services hr-cloud-infra-dev-backend-service \
     --region us-west-2
   ```

**⏱️ Deployment time: ~5 minutes**

### Step 5: Deploy Frontend

1. Navigate to frontend directory:
   ```bash
   cd ../frontend
   ```

2. Get S3 bucket name and CloudFront distribution ID:
   ```bash
   S3_BUCKET=$(terraform output -raw frontend_s3_bucket -state=../terraform/terraform.tfstate)
   CF_DIST_ID=$(terraform output -raw cloudfront_distribution_id -state=../terraform/terraform.tfstate)
   ALB_DNS=$(terraform output -raw alb_dns_name -state=../terraform/terraform.tfstate)
   ```

3. Create production environment file:
   ```bash
   echo "VITE_API_URL=http://$ALB_DNS" > .env.production
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Build the application:
   ```bash
   npm run build
   ```

6. Deploy to S3:
   ```bash
   aws s3 sync dist/ s3://$S3_BUCKET/ --delete
   ```

7. Invalidate CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id $CF_DIST_ID \
     --paths "/*"
   ```

**⏱️ Deployment time: ~2-3 minutes (CloudFront invalidation takes 5-10 minutes)**

### Step 6: Verify Deployment

1. Get the application URLs:
   ```bash
   cd ../terraform
   terraform output alb_url
   terraform output cloudfront_url
   ```

2. Test the backend:
   ```bash
   curl http://YOUR_ALB_DNS/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "HR Cloud API",
     "version": "1.0.0",
     "environment": "dev"
   }
   ```

3. Access the frontend:
   - Open the CloudFront URL in your browser
   - You should see the HR Cloud Platform homepage
   - The system status should show "All Systems Operational"

## 🔄 Updates and Redeployment

### Update Backend

```bash
cd backend

# Build and push new image
docker build --platform linux/amd64 -t $ECR_URL:latest .
docker push $ECR_URL:latest

# Force new deployment
aws ecs update-service \
  --cluster hr-cloud-infra-dev-cluster \
  --service hr-cloud-infra-dev-backend-service \
  --force-new-deployment \
  --region us-west-2
```

### Update Frontend

```bash
cd frontend

# Build and deploy
npm run build
aws s3 sync dist/ s3://$S3_BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

### Update Infrastructure

```bash
cd terraform

# Review changes
terraform plan

# Apply changes
terraform apply
```

## 🔒 Secrets Management

### View Database Credentials

```bash
aws secretsmanager get-secret-value \
  --secret-id hr-cloud-infra-dev-db-credentials \
  --region us-west-2 \
  --query SecretString \
  --output text | jq
```

### Connect to Database

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw rds_endpoint -state=terraform/terraform.tfstate)

# Get credentials from Secrets Manager
DB_CREDS=$(aws secretsmanager get-secret-value \
  --secret-id hr-cloud-infra-dev-db-credentials \
  --region us-west-2 \
  --query SecretString --output text)

DB_USER=$(echo $DB_CREDS | jq -r .username)
DB_PASS=$(echo $DB_CREDS | jq -r .password)
DB_NAME=$(echo $DB_CREDS | jq -r .dbname)

# Connect using psql (requires bastion host or VPN)
psql -h $RDS_ENDPOINT -U $DB_USER -d $DB_NAME
```

## 📊 Monitoring and Logs

### View CloudWatch Logs

```bash
# Backend logs
aws logs tail /ecs/hr-cloud-infra-dev-backend --follow --region us-west-2
```

### Access CloudWatch Dashboard

1. Go to AWS Console → CloudWatch → Dashboards
2. Open `hr-cloud-infra-dev-dashboard`
3. View metrics for ECS, RDS, ALB, and CloudFront

### Check Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix hr-cloud-infra-dev \
  --region us-west-2
```

## 🧹 Cleanup (Destroy Resources)

**⚠️ Warning: This will delete all resources and data!**

```bash
cd terraform

# Destroy all infrastructure
terraform destroy
```

Note: Some resources may need manual deletion:
- S3 buckets with content (empty them first)
- ECR repositories with images
- CloudWatch log groups (if retention is set)

## 🐛 Troubleshooting

### ECS Tasks Not Starting

1. Check ECS service events:
   ```bash
   aws ecs describe-services \
     --cluster hr-cloud-infra-dev-cluster \
     --services hr-cloud-infra-dev-backend-service \
     --region us-west-2
   ```

2. Check task logs:
   ```bash
   aws logs tail /ecs/hr-cloud-infra-dev-backend --since 10m
   ```

3. Verify security groups allow traffic from ALB to ECS tasks

### Database Connection Issues

1. Verify RDS is running:
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier hr-cloud-infra-dev-db \
     --region us-west-2
   ```

2. Check security groups allow traffic from ECS tasks to RDS

3. Verify credentials in Secrets Manager

### Frontend Not Loading

1. Check S3 bucket contents:
   ```bash
   aws s3 ls s3://$S3_BUCKET/
   ```

2. Check CloudFront distribution status:
   ```bash
   aws cloudfront get-distribution --id $CF_DIST_ID
   ```

3. Verify API URL in frontend environment variables

### Terraform Errors

1. Check AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```

2. Ensure you have all required permissions

3. Check for resource naming conflicts

4. Review Terraform state:
   ```bash
   terraform state list
   ```

## 📝 Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
   - Register domain in Route 53
   - Create SSL certificate in ACM
   - Update ALB and CloudFront to use custom domain

2. **Configure CI/CD**
   - Set up GitHub Actions secrets
   - Enable automated deployments

3. **Implement HR features**
   - Add authentication
   - Create employee management endpoints
   - Build admin dashboard

4. **Enhance security**
   - Restrict CORS origins
   - Implement rate limiting
   - Enable WAF on CloudFront

5. **Set up monitoring alerts**
   - Configure SNS email notifications
   - Set up PagerDuty or similar
   - Create custom CloudWatch dashboards

## 📚 Additional Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)



