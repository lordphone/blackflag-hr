# Backend API

A FastAPI-based REST API designed to run on AWS ECS Fargate. This backend is ready to support an HR platform with employee management, authentication, and other enterprise features.

## 🚀 Features

- **FastAPI Framework**: Modern, fast Python web framework
- **PostgreSQL Database**: Production-ready database with connection pooling
- **Health Checks**: Built-in health endpoints for ALB monitoring
- **Logging**: Structured JSON logging for CloudWatch
- **Docker Ready**: Optimized Dockerfile for containerization
- **Auto-migration**: Database migrations on startup

## 📁 Project Structure

```
backend/
├── src/
│   ├── __init__.py
│   ├── main.py           # FastAPI application entry point
│   ├── config.py         # Configuration management
│   ├── database.py       # Database connection and models
│   ├── models.py         # SQLAlchemy models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py     # Health check endpoints
│   │   └── employees.py  # Employee management (future)
│   └── utils/
│       ├── __init__.py
│       └── logger.py     # Logging configuration
├── Dockerfile
├── requirements.txt
├── .dockerignore
└── README.md
```

## 🛠️ Local Development

### Prerequisites

- Python 3.11+
- PostgreSQL (or use Docker)
- pip and virtualenv

### Setup

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set environment variables**
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=hrdb
   export DB_USERNAME=postgres
   export DB_PASSWORD=your_password
   export ENVIRONMENT=dev
   ```

4. **Run the application**
   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access the API**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

## 🐳 Docker

### Build Image

```bash
docker build -t hr-backend .
```

### Run Container

```bash
docker run -p 8000:8000 \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_NAME=hrdb \
  -e DB_USERNAME=dbadmin \
  -e DB_PASSWORD=your_password \
  -e ENVIRONMENT=dev \
  hr-backend
```

## ☁️ AWS Deployment

### Push to ECR

```bash
# Get ECR login
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin YOUR_ECR_URL

# Build for your platform
docker build --platform linux/amd64 -t YOUR_ECR_URL:latest .

# Push
docker push YOUR_ECR_URL:latest
```

### Deploy to ECS

The Terraform infrastructure automatically deploys this image to ECS Fargate. After pushing to ECR:

```bash
# Update ECS service to use new image
aws ecs update-service \
  --cluster hr-cloud-infra-dev-cluster \
  --service hr-cloud-infra-dev-backend-service \
  --force-new-deployment \
  --region us-west-2
```

## 📊 API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (includes DB connection)

### Future Endpoints (HR Platform)

- `POST /api/v1/employees` - Create employee
- `GET /api/v1/employees` - List employees
- `GET /api/v1/employees/{id}` - Get employee details
- `PUT /api/v1/employees/{id}` - Update employee
- `DELETE /api/v1/employees/{id}` - Delete employee

## 🔒 Security

- Environment variables for sensitive data
- AWS Secrets Manager integration
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy
- CORS configuration

## 📝 Configuration

Configuration is managed through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | `dev` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `hrdb` |
| `DB_USERNAME` | Database username | Required |
| `DB_PASSWORD` | Database password | Required |
| `LOG_LEVEL` | Logging level | `INFO` |

## 🧪 Testing

```bash
# Install dev dependencies
pip install pytest pytest-cov httpx

# Run tests
pytest

# Run with coverage
pytest --cov=src tests/
```

## 📈 Monitoring

Logs are sent to CloudWatch in structured JSON format:

```json
{
  "timestamp": "2025-11-19T10:30:00Z",
  "level": "INFO",
  "message": "Request processed",
  "request_id": "abc123",
  "duration_ms": 45
}
```

## 🔧 Development Notes

- Uses SQLAlchemy for ORM
- Async database operations with asyncpg
- Alembic for database migrations (can be added)
- FastAPI automatic OpenAPI documentation



