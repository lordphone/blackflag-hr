#!/bin/bash

##############################################################################
# Setup GitHub Secrets Script
#
# This script extracts resource names from Terraform outputs and sets them
# as GitHub repository secrets for the CI/CD workflows.
#
# Usage: ./scripts/setup-github-secrets.sh [github-repo-owner/repo-name]
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v gh >/dev/null 2>&1 || missing_tools+=("gh")

    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_error "Please install missing tools and try again."
        exit 1
    fi

    # Check if user is logged in to GitHub CLI
    if ! gh auth status &>/dev/null; then
        log_error "GitHub CLI not authenticated. Run 'gh auth login'."
        exit 1
    fi

    log_success "All prerequisites met"
}

# Main script
main() {
    local repo_name="${1:-}"

    if [ -z "$repo_name" ]; then
        log_error "GitHub repository name required."
        log_info "Usage: $0 [owner/repo-name]"
        exit 1
    fi

    echo ""
    log_info "🔧 Setting up GitHub secrets for $repo_name"
    echo ""

    check_prerequisites

    # Navigate to terraform directory
    cd "$(dirname "$0")/../terraform"

    # Check if terraform is applied
    if ! terraform state list >/dev/null 2>&1; then
        log_error "Terraform state not found. Make sure infrastructure is deployed."
        exit 1
    fi

    log_info "Extracting resource names from Terraform outputs..."

    # Get resource names from Terraform outputs
    ECR_REPOSITORY=$(terraform output -raw ecr_repository_url 2>/dev/null | sed 's|.*/||' || echo "")
    ECS_CLUSTER=$(terraform output -raw ecs_cluster_name 2>/dev/null || echo "")
    ECS_SERVICE=$(terraform output -raw ecs_service_name 2>/dev/null || echo "")

    if [ -z "$ECR_REPOSITORY" ] || [ -z "$ECS_CLUSTER" ] || [ -z "$ECS_SERVICE" ]; then
        log_error "Could not extract resource names from Terraform outputs."
        exit 1
    fi

    log_info "Resource names extracted:"
    log_info "  ECR Repository: $ECR_REPOSITORY"
    log_info "  ECS Cluster: $ECS_CLUSTER"
    log_info "  ECS Service: $ECS_SERVICE"
    echo ""

    # Set GitHub secrets
    log_info "Setting GitHub secrets..."

    gh secret set ECR_REPOSITORY --body "$ECR_REPOSITORY" --repo "$repo_name"
    log_success "Set ECR_REPOSITORY secret"

    gh secret set ECS_CLUSTER --body "$ECS_CLUSTER" --repo "$repo_name"
    log_success "Set ECS_CLUSTER secret"

    gh secret set ECS_SERVICE --body "$ECS_SERVICE" --repo "$repo_name"
    log_success "Set ECS_SERVICE secret"

    echo ""
    log_success "🎉 GitHub secrets configured successfully!"
    log_info "The CI/CD workflows will now use the correct resource names."
    echo ""
}

# Run main function
main "$@"