#!/bin/bash
# Cleanup script for k3s deployment

set -e

echo "=== Wajibika Mazingira - Cleanup Script ==="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ask for confirmation
read -p "Are you sure you want to remove the Wajibika Mazingira deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Removing Kubernetes resources...${NC}"

# Delete ingress
kubectl delete ingress wajibika-ingress -n wajibika-mazingira --ignore-not-found
echo -e "${GREEN}✓ Ingress removed${NC}"

# Delete services
kubectl delete svc wajibika-frontend wajibika-server -n wajibika-mazingira --ignore-not-found
echo -e "${GREEN}✓ Services removed${NC}"

# Delete deployments
kubectl delete deployment wajibika-frontend wajibika-server -n wajibika-mazingira --ignore-not-found
echo -e "${GREEN}✓ Deployments removed${NC}"

# Delete HPA
kubectl delete hpa wajibika-frontend-hpa wajibika-server-hpa -n wajibika-mazingira --ignore-not-found
echo -e "${GREEN}✓ Autoscalers removed${NC}"

# Delete config and secrets
kubectl delete configmap nginx-config wajibika-config -n wajibika-mazingira --ignore-not-found
kubectl delete secret wajibika-tls -n wajibika-mazingira --ignore-not-found
echo -e "${GREEN}✓ ConfigMaps and Secrets removed${NC}"

# Delete namespace
kubectl delete namespace wajibika-mazingira --ignore-not-found
echo -e "${GREEN}✓ Namespace removed${NC}"

echo ""
echo "Optional: Remove Docker images"
echo "  docker rmi wajibika-mazingira:frontend-latest wajibika-mazingira:server-latest"
echo ""
echo -e "${GREEN}✓ Cleanup complete!${NC}"
