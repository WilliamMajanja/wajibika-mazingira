# Docker Compose Quick Start Guide

## Overview

This Docker Compose configuration provides a quick way to test the Wajibika Mazingira application locally before deploying to k3s.

## Prerequisites

- Docker Desktop or Docker Engine + Docker Compose
- 2GB RAM minimum
- 1GB free disk space

## Quick Start

### Build and Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Access the Application

- **Frontend**: http://localhost/wajibika-mazingira/
- **Backend API**: http://localhost:4001

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f server
```

### Stop Services

```bash
# Stop all services (keep containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove with volumes
docker-compose down -v
```

## Service Configuration

### Frontend Service
- **Image**: Built from `Dockerfile.frontend`
- **Port**: 80 (mapped to localhost:80)
- **Health Check**: HTTP GET to `/health` every 30s
- **Environment**: `API_BASE_URL=http://server:4001`

### Backend Service
- **Image**: Built from `Dockerfile.server`
- **Port**: 4001
- **Health Check**: HTTP GET to `/health` every 30s
- **Environment**: `NODE_ENV=production`

## Common Commands

```bash
# Check service status
docker-compose ps

# Restart a service
docker-compose restart frontend

# Rebuild specific service
docker-compose build frontend

# View resource usage
docker stats

# Execute command in container
docker-compose exec frontend sh
```

## Troubleshooting

### Port Already in Use

If port 80 or 4001 are already in use, modify the `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "8080:80"  # Access at http://localhost:8080

server:
  ports:
    - "4002:4001"  # Access at http://localhost:4002
```

### Memory Issues

Increase Docker's available memory:
- Docker Desktop: Preferences > Resources > Memory
- Recommended: 4GB+

### Image Build Failures

```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Transitioning to k3s

After testing with Docker Compose:

1. Stop Docker Compose services:
   ```bash
   docker-compose down
   ```

2. Push images to container registry (optional):
   ```bash
   docker tag wajibika-mazingira:frontend-latest your-registry/wajibika-mazingira:frontend-latest
   docker push your-registry/wajibika-mazingira:frontend-latest
   ```

3. Follow the k3s deployment guide: `k8s/DEPLOYMENT.md`

## Development Tips

### Mount Source Code for Live Updates

Edit `docker-compose.yml`:

```yaml
frontend:
  volumes:
    - ./src:/app/src
    - ./public:/app/public

server:
  volumes:
    - ./server:/app
```

Then rebuild with `docker-compose up --build`.

### Use Environment File

Create `.env`:
```
API_BASE_URL=http://localhost:4001
NODE_ENV=development
```

Reference in `docker-compose.yml`:
```yaml
env_file:
  - .env
```
