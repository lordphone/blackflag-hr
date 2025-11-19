# Quick Start

Here is how to get the infrastructure up and running quickly.

## Prerequisites

You need these installed:
*   AWS CLI (configured with your credentials)
*   Terraform (v1.5+)
*   Docker
*   Node.js & Python

## Deploying

1.  **Configure Terraform**
    
    Go to the terraform directory and create your variables file.
    ```bash
    cd terraform
    cp terraform.tfvars.example terraform.tfvars
    # Open terraform.tfvars and change the default values if you want
    cd ..
    ```

2.  **Run the Deploy Script**
    
    We included a script that handles the Terraform apply, Docker build/push, and frontend sync.
    ```bash
    ./scripts/deploy.sh all
    ```
    
    This takes about 15 minutes (mostly waiting for RDS and CloudFront).

3.  **Check it out**
    
    The script will output the URLs at the end.
    *   **Frontend:** The CloudFront URL.
    *   **Backend:** The ALB URL (check `/health` to confirm it's up).

## Clean Up

To tear everything down so you stop paying for it:

```bash
./scripts/destroy.sh
```

**Note:** This deletes everything, including the database.
