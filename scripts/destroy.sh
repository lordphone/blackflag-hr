#!/bin/bash

##############################################################################
# Cleanup Script for HR Cloud Infrastructure
# 
# This script safely destroys all AWS resources created by Terraform.
# 
# Usage: ./scripts/destroy.sh
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

log_error() {
    echo -e "${RED}✗ ${NC}$1"
}

log_info() {
    echo -e "${GREEN}ℹ ${NC}$1"
}

echo ""
log_warning "⚠️  WARNING: This will destroy ALL infrastructure resources!"
log_warning "This includes:"
log_warning "  - ECS cluster and services"
log_warning "  - RDS database (and all data)"
log_warning "  - S3 bucket and contents"
log_warning "  - CloudFront distribution"
log_warning "  - VPC and networking"
log_warning "  - All other AWS resources"
echo ""

read -p "Are you absolutely sure you want to proceed? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "Destruction cancelled"
    exit 0
fi

echo ""
read -p "Last chance! Type the project name 'hr-cloud-infra' to confirm: " project_confirm

if [ "$project_confirm" != "hr-cloud-infra" ]; then
    log_error "Project name mismatch. Destruction cancelled"
    exit 1
fi

cd "$PROJECT_ROOT/terraform"

log_info "Destroying infrastructure..."
terraform destroy

log_info "Cleanup complete!"
echo ""



