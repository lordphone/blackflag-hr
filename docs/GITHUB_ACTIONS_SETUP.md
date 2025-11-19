# GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions secrets for automated CI/CD deployments.

## 📋 Prerequisites

- GitHub repository with admin access
- AWS Account with deployed infrastructure (via Terraform)
- AWS IAM user with programmatic access

## 🔑 Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

### AWS Credentials

1. **AWS_ACCESS_KEY_ID**
   - Description: AWS access key for GitHub Actions
   - How to get: Create IAM user with programmatic access

2. **AWS_SECRET_ACCESS_KEY**
   - Description: AWS secret access key
   - How to get: Obtained when creating IAM user

### Backend Deployment

These are automatically created by Terraform, but verify the names:

3. **ECR_REPOSITORY** (optional, set in workflow)
   - Description: ECR repository name
   - Example: `hr-cloud-infra-dev-backend`

4. **ECS_CLUSTER** (optional, set in workflow)
   - Description: ECS cluster name
   - Example: `hr-cloud-infra-dev-cluster`

5. **ECS_SERVICE** (optional, set in workflow)
   - Description: ECS service name
   - Example: `hr-cloud-infra-dev-backend-service`

### Frontend Deployment

6. **S3_BUCKET_NAME**
   - Description: S3 bucket name for frontend
   - How to get:
     ```bash
     cd terraform
     terraform output frontend_s3_bucket
     ```

7. **CLOUDFRONT_DISTRIBUTION_ID**
   - Description: CloudFront distribution ID
   - How to get:
     ```bash
     cd terraform
     terraform output cloudfront_distribution_id
     ```

8. **CLOUDFRONT_DOMAIN**
   - Description: CloudFront domain name
   - How to get:
     ```bash
     cd terraform
     terraform output cloudfront_domain_name
     ```

9. **VITE_API_URL_PROD**
   - Description: Production backend API URL
   - How to get:
     ```bash
     cd terraform
     terraform output alb_url
     ```
   - Example: `http://hr-cloud-infra-dev-alb-123456789.us-west-2.elb.amazonaws.com`

## 🔧 Setting Up IAM User for GitHub Actions

### Step 1: Create IAM User

```bash
aws iam create-user --user-name github-actions-deployer
```

### Step 2: Create Access Key

```bash
aws iam create-access-key --user-name github-actions-deployer
```

Save the `AccessKeyId` and `SecretAccessKey` - you'll need these for GitHub secrets.

### Step 3: Create IAM Policy

Create a file `github-actions-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hr-cloud-infra-dev-frontend-*",
        "arn:aws:s3:::hr-cloud-infra-dev-frontend-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 4: Attach Policy

```bash
aws iam put-user-policy \
  --user-name github-actions-deployer \
  --policy-name GitHubActionsPolicy \
  --policy-document file://github-actions-policy.json
```

## 📝 Adding Secrets to GitHub

### Via GitHub Web UI

1. Go to your repository on GitHub
2. Click **Settings**
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with its name and value
6. Click **Add secret**

### Via GitHub CLI

```bash
# Install GitHub CLI if needed
# https://cli.github.com/

# Authenticate
gh auth login

# Add secrets
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set S3_BUCKET_NAME
gh secret set CLOUDFRONT_DISTRIBUTION_ID
gh secret set CLOUDFRONT_DOMAIN
gh secret set VITE_API_URL_PROD
```

## ✅ Verification

### Test Backend Workflow

1. Make a change to backend code:
   ```bash
   echo "# Updated" >> backend/README.md
   git add backend/README.md
   git commit -m "test: trigger backend workflow"
   git push origin main
   ```

2. Check GitHub Actions:
   - Go to **Actions** tab
   - Watch the **Backend CI/CD** workflow
   - Verify it completes successfully

### Test Frontend Workflow

1. Make a change to frontend code:
   ```bash
   echo "# Updated" >> frontend/README.md
   git add frontend/README.md
   git commit -m "test: trigger frontend workflow"
   git push origin main
   ```

2. Check GitHub Actions:
   - Go to **Actions** tab
   - Watch the **Frontend CI/CD** workflow
   - Verify it completes successfully

### Test Terraform Workflow

1. Make a change to Terraform code:
   ```bash
   echo "# Updated" >> terraform/README.md
   git add terraform/README.md
   git commit -m "test: trigger terraform workflow"
   git push origin main
   ```

2. Check GitHub Actions:
   - Go to **Actions** tab
   - Watch the **Terraform CI/CD** workflow
   - Verify it completes successfully

## 🐛 Troubleshooting

### Authentication Failed

**Error**: `Unable to locate credentials`

**Solution**: 
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set correctly
- Check IAM user has necessary permissions
- Ensure secrets have no extra spaces or newlines

### ECR Push Failed

**Error**: `denied: User: ... is not authorized to perform: ecr:PutImage`

**Solution**:
- Add ECR permissions to IAM user policy
- Verify ECR repository exists
- Check repository name matches

### ECS Update Failed

**Error**: `Unable to update service`

**Solution**:
- Add ECS permissions to IAM user policy
- Verify cluster and service names
- Check service exists

### S3 Sync Failed

**Error**: `Access Denied`

**Solution**:
- Add S3 permissions to IAM user policy
- Verify bucket name is correct
- Check bucket exists

### CloudFront Invalidation Failed

**Error**: `AccessDenied`

**Solution**:
- Add CloudFront permissions to IAM user policy
- Verify distribution ID is correct
- Wait for previous invalidation to complete

## 🔒 Security Best Practices

1. **Principle of Least Privilege**
   - Only grant necessary permissions
   - Use resource-specific ARNs when possible
   - Regularly audit permissions

2. **Rotate Credentials**
   - Rotate access keys every 90 days
   - Use AWS IAM access analyzer
   - Monitor CloudTrail logs

3. **Use Environments**
   - Separate secrets for dev/staging/prod
   - Use GitHub environments for additional protection
   - Require approvals for production deployments

4. **Secret Scanning**
   - Enable GitHub secret scanning
   - Use `.gitignore` for local secrets
   - Never commit secrets to repository

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OIDC with AWS](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## ✨ Advanced: Using OIDC (Recommended for Production)

Instead of long-lived access keys, use OpenID Connect (OIDC) for more secure authentication:

1. Configure OIDC provider in AWS
2. Create IAM role with trust policy
3. Update GitHub Actions to assume role
4. No need for `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`

See AWS documentation for detailed OIDC setup instructions.



