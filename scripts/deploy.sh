#!/bin/bash

##############################################################################
# Deployment Script for HR Cloud Infrastructure
# 
# This script automates the deployment of the entire stack:
# 1. Terraform infrastructure
# 2. Backend API
# 3. Frontend application
#
# Usage: ./scripts/deploy.sh [option]
# Options:
#   all        - Deploy everything (default)
#   infra      - Deploy only infrastructure
#   backend    - Deploy only backend
#   frontend   - Deploy only frontend
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-west-2}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Functions
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

log_error() {
    echo -e "${RED}✗ ${NC}$1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v aws >/dev/null 2>&1 || missing_tools+=("aws")
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure'."
        exit 1
    fi
    
    log_success "All prerequisites met"
}

deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd "$PROJECT_ROOT/terraform"
    
    # Check if terraform.tfvars exists
    if [ ! -f "terraform.tfvars" ]; then
        log_warning "terraform.tfvars not found. Please create it from terraform.tfvars.example"
        log_info "Run: cp terraform.tfvars.example terraform.tfvars"
        exit 1
    fi
    
    log_info "Initializing Terraform..."
    terraform init
    
    log_info "Planning infrastructure changes..."
    terraform plan -out=tfplan
    
    read -p "Apply these changes? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_warning "Deployment cancelled"
        exit 0
    fi
    
    log_info "Applying infrastructure..."
    terraform apply tfplan
    
    log_success "Infrastructure deployed successfully!"
    
    # Save outputs
    terraform output > "$PROJECT_ROOT/terraform-outputs.txt"
    log_info "Outputs saved to terraform-outputs.txt"
}

deploy_backend() {
    log_info "Deploying backend..."
    
    cd "$PROJECT_ROOT/terraform"
    
    # Get ECR URL from Terraform
    ECR_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
    if [ -z "$ECR_URL" ]; then
        log_error "Could not get ECR URL. Make sure infrastructure is deployed."
        exit 1
    fi
    
    log_info "ECR Repository: $ECR_URL"
    
    # Login to ECR
    log_info "Logging in to Amazon ECR..."
    aws ecr get-login-password --region "$AWS_REGION" | \
        docker login --username AWS --password-stdin "$ECR_URL"
    
    # Build Docker image
    log_info "Building Docker image..."
    cd "$PROJECT_ROOT/backend"
    docker build --platform linux/amd64 -t "$ECR_URL:latest" .
    
    # Push to ECR
    log_info "Pushing image to ECR..."
    docker push "$ECR_URL:latest"
    
    # Update ECS service
    log_info "Updating ECS service..."
    ECS_CLUSTER=$(cd "$PROJECT_ROOT/terraform" && terraform output -raw ecs_cluster_name)
    ECS_SERVICE=$(cd "$PROJECT_ROOT/terraform" && terraform output -raw ecs_service_name)
    
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --force-new-deployment \
        --region "$AWS_REGION" \
        > /dev/null
    
    log_info "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --region "$AWS_REGION"
    
    log_success "Backend deployed successfully!"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    
    cd "$PROJECT_ROOT/terraform"
    
    # Get deployment info from Terraform
    S3_BUCKET=$(terraform output -raw frontend_s3_bucket 2>/dev/null || echo "")
    ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    
    if [ -z "$S3_BUCKET" ] || [ -z "$ALB_DNS" ]; then
        log_error "Could not get deployment info. Make sure infrastructure is deployed."
        exit 1
    fi
    
    log_info "S3 Bucket: $S3_BUCKET"
    log_info "Backend API: http://$ALB_DNS"
    
    # Create production env file
    cd "$PROJECT_ROOT/frontend"
    echo "VITE_API_URL=http://$ALB_DNS" > .env.production
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci
    
    # Build
    log_info "Building frontend..."
    npm run build
    
    # Deploy to S3
    log_info "Deploying to S3..."
    aws s3 sync dist/ "s3://$S3_BUCKET/" --delete
    
    # Get CloudFront distribution ID
    cd "$PROJECT_ROOT/terraform"
    CF_DIST_ID=$(terraform output -json | jq -r '.cloudfront_distribution.value.id' 2>/dev/null || echo "")
    
    if [ -n "$CF_DIST_ID" ]; then
        # Invalidate CloudFront cache
        log_info "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation \
            --distribution-id "$CF_DIST_ID" \
            --paths "/*" \
            > /dev/null
        log_info "Cache invalidation initiated (may take 5-10 minutes)"
    fi
    
    log_success "Frontend deployed successfully!"
}

show_urls() {
    log_info "Deployment complete! Access your application:"
    echo ""
    
    cd "$PROJECT_ROOT/terraform"
    
    ALB_URL=$(terraform output -raw alb_url 2>/dev/null || echo "")
    CF_URL=$(terraform output -raw cloudfront_url 2>/dev/null || echo "")
    
    if [ -n "$ALB_URL" ]; then
        echo -e "${GREEN}Backend API:${NC} $ALB_URL"
        echo -e "${GREEN}Health Check:${NC} $ALB_URL/health"
        echo -e "${GREEN}API Docs:${NC} $ALB_URL/docs"
    fi
    
    if [ -n "$CF_URL" ]; then
        echo -e "${GREEN}Frontend:${NC} $CF_URL"
    fi
    
    echo ""
}

# Main script
main() {
    local deployment_type="${1:-all}"
    
    echo ""
    log_info "🚀 HR Cloud Infrastructure Deployment"
    log_info "Deployment type: $deployment_type"
    echo ""
    
    check_prerequisites
    
    case "$deployment_type" in
        all)
            deploy_infrastructure
            deploy_backend
            deploy_frontend
            ;;
        infra)
            deploy_infrastructure
            ;;
        backend)
            deploy_backend
            ;;
        frontend)
            deploy_frontend
            ;;
        *)
            log_error "Invalid option: $deployment_type"
            log_info "Usage: $0 [all|infra|backend|frontend]"
            exit 1
            ;;
    esac
    
    echo ""
    show_urls
    log_success "🎉 Deployment complete!"
    echo ""
}

# Run main function
main "$@"



