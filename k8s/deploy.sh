#!/bin/bash
# Quick deployment script for k3s

set -e

echo "=== Wajibika Mazingira - k3s Deployment Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl not found. Installing k3s...${NC}"
    curl -sfL https://get.k3s.io | sh -
    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
fi

echo -e "${GREEN}✓ kubectl is available${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found. Please install Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is available${NC}"
echo ""

# Step 1: Build images
echo -e "${YELLOW}[1/5] Building Docker images...${NC}"
docker build -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest . --quiet
echo -e "${GREEN}✓ Frontend image built${NC}"

docker build -f Dockerfile.server -t wajibika-mazingira:server-latest . --quiet
echo -e "${GREEN}✓ Backend image built${NC}"
echo ""

# Step 2: Load images into k3s
echo -e "${YELLOW}[2/5] Loading images into k3s...${NC}"
docker save wajibika-mazingira:frontend-latest | sudo k3s ctr images import - 2>/dev/null
echo -e "${GREEN}✓ Frontend image loaded${NC}"

docker save wajibika-mazingira:server-latest | sudo k3s ctr images import - 2>/dev/null
echo -e "${GREEN}✓ Backend image loaded${NC}"
echo ""

# Step 3: Deploy to k3s
echo -e "${YELLOW}[3/5] Deploying to k3s...${NC}"
kubectl apply -f k8s/deployment.yaml
echo -e "${GREEN}✓ Deployments applied${NC}"

kubectl apply -f k8s/config.yaml
echo -e "${GREEN}✓ Configuration applied${NC}"

kubectl apply -f k8s/ingress.yaml
echo -e "${GREEN}✓ Ingress configured${NC}"
echo ""

# Step 4: Wait for deployments
echo -e "${YELLOW}[4/5] Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/wajibika-frontend -n wajibika-mazingira --timeout=5m
echo -e "${GREEN}✓ Frontend deployment ready${NC}"

kubectl rollout status deployment/wajibika-server -n wajibika-mazingira --timeout=5m
echo -e "${GREEN}✓ Backend deployment ready${NC}"
echo ""

# Step 5: Display access information
echo -e "${YELLOW}[5/5] Deployment complete!${NC}"
echo ""
echo -e "${GREEN}=== Access Information ===${NC}"
echo ""

# Get service information
FRONTEND_IP=$(kubectl get svc wajibika-frontend -n wajibika-mazingira -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "pending")
BACKEND_IP=$(kubectl get svc wajibika-server -n wajibika-mazingira -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "pending")

echo "Frontend Service: http://$FRONTEND_IP:80/wajibika-mazingira/"
echo "Backend Service: http://$BACKEND_IP:4001"
echo ""

echo "For local access, run:"
echo "  kubectl port-forward -n wajibika-mazingira svc/wajibika-frontend 8080:80"
echo ""
echo "Then open: http://localhost:8080/wajibika-mazingira/"
echo ""

echo "To view logs:"
echo "  kubectl logs -n wajibika-mazingira deployment/wajibika-frontend -f"
echo "  kubectl logs -n wajibika-mazingira deployment/wajibika-server -f"
echo ""

echo "To check pod status:"
echo "  kubectl get pods -n wajibika-mazingira"
echo ""

echo -e "${GREEN}✓ Deployment successful!${NC}"
