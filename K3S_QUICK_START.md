# Quick Start Guide: Kubernetes Deployment with k3s

## 📋 Overview

This guide provides a quick reference for deploying the Wajibika Mazingira application using k3s.

## ⚡ Super Quick (5 minutes)

### 1. Install k3s

```bash
curl -sfL https://get.k3s.io | sh -
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

### 2. Build Images

```bash
cd /path/to/wajibika-mazingira
docker build -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest .
docker build -f Dockerfile.server -t wajibika-mazingira:server-latest .
```

### 3. Deploy

```bash
# Run the automatic deployment script
bash k8s/deploy.sh

# Or manually apply configurations
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Access

```bash
# Port forward to access locally
kubectl port-forward -n wajibika-mazingira svc/wajibika-frontend 8080:80

# Open browser to: http://localhost:8080/wajibika-mazingira/
```

## 📁 File Structure

```
wajibika-mazingira/
├── Dockerfile.frontend          # Multi-stage frontend build
├── Dockerfile.server            # Backend service image
├── nginx.conf                   # Nginx configuration
├── docker-compose.yml           # Local testing
├── DOCKER_COMPOSE.md            # Docker Compose guide
├── k8s/
│   ├── DEPLOYMENT.md            # Complete deployment guide
│   ├── deployment.yaml          # K8s deployments & services
│   ├── config.yaml              # ConfigMaps, HPA, monitoring
│   ├── ingress.yaml             # Ingress and network policies
│   ├── deploy.sh                # Automated deployment script
│   └── cleanup.sh               # Cleanup script
└── ...
```

## 🚀 Deployment Options

### Option 1: Automatic (Recommended)

```bash
bash k8s/deploy.sh
```

### Option 2: Manual Step-by-Step

```bash
# Load images into k3s
docker save wajibika-mazingira:frontend-latest | sudo k3s ctr images import -
docker save wajibika-mazingira:server-latest | sudo k3s ctr images import -

# Create namespace and deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get pods -n wajibika-mazingira
```

### Option 3: Docker Compose (Local Testing)

```bash
docker-compose up --build
# Access at http://localhost/wajibika-mazingira/
```

## 📊 Monitoring and Debugging

### Check Deployment Status

```bash
# View all resources
kubectl get all -n wajibika-mazingira

# Watch rollout
kubectl rollout status deployment/wajibika-frontend -n wajibika-mazingira

# Check pod status
kubectl describe pod <pod-name> -n wajibika-mazingira
```

### View Logs

```bash
# Frontend logs
kubectl logs -f deployment/wajibika-frontend -n wajibika-mazingira

# Backend logs
kubectl logs -f deployment/wajibika-server -n wajibika-mazingira

# All logs with timestamps
kubectl logs -f deployment/wajibika-frontend -n wajibika-mazingira --timestamps
```

### Resource Usage

```bash
# CPU and memory usage
kubectl top nodes
kubectl top pods -n wajibika-mazingira

# Watch in real-time
watch kubectl top pods -n wajibika-mazingira
```

## 🛠 Common Tasks

### Scale Up/Down

```bash
# Scale manually
kubectl scale deployment wajibika-frontend --replicas=3 -n wajibika-mazingira

# View autoscaler status
kubectl get hpa -n wajibika-mazingira
```

### Update Application

```bash
# Rebuild image
docker build -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest .

# Reload image into k3s
docker save wajibika-mazingira:frontend-latest | sudo k3s ctr images import -

# Restart deployment
kubectl rollout restart deployment/wajibika-frontend -n wajibika-mazingira
```

### View Service Endpoints

```bash
kubectl get svc -n wajibika-mazingira -o wide
kubectl get endpoints -n wajibika-mazingira
```

### Port Forward

```bash
# Forward frontend to localhost:8080
kubectl port-forward -n wajibika-mazingira svc/wajibika-frontend 8080:80

# Forward backend to localhost:4001
kubectl port-forward -n wajibika-mazingira svc/wajibika-server 4001:4001

# Forward from another machine (use 0.0.0.0)
kubectl port-forward --address 0.0.0.0 -n wajibika-mazingira svc/wajibika-frontend 8080:80
```

## 🔧 Configuration Changes

### Update Environment Variables

Edit `k8s/config.yaml` and update ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wajibika-config
  namespace: wajibika-mazingira
data:
  API_BASE_URL: "http://your-server:4001"
  OLLAMA_BASE_URL: "http://ollama:11434"
```

Then apply:
```bash
kubectl apply -f k8s/config.yaml
kubectl rollout restart deployment/wajibika-frontend -n wajibika-mazingira
```

### Change Replicas

Edit `k8s/deployment.yaml`:

```yaml
spec:
  replicas: 3  # Change this number
```

Apply changes:
```bash
kubectl apply -f k8s/deployment.yaml
```

### Adjust Resource Limits

Edit `k8s/deployment.yaml`:

```yaml
resources:
  requests:
    memory: "256Mi"  # Increase memory request
    cpu: "200m"      # Increase CPU request
  limits:
    memory: "512Mi"  # Increase memory limit
    cpu: "1000m"     # Increase CPU limit
```

Apply changes:
```bash
kubectl apply -f k8s/deployment.yaml
```

## 🧹 Cleanup

### Stop Deployment

```bash
# Delete all resources
kubectl delete namespace wajibika-mazingira

# Or use the cleanup script
bash k8s/cleanup.sh
```

### Remove Docker Images

```bash
docker rmi wajibika-mazingira:frontend-latest wajibika-mazingira:server-latest
```

### Uninstall k3s

```bash
/usr/local/bin/k3s-uninstall.sh
```

## 📞 Troubleshooting

### Pods not starting

```bash
# Check events
kubectl get events -n wajibika-mazingira --sort-by='.lastTimestamp'

# Check pod details
kubectl describe pod <pod-name> -n wajibika-mazingira

# Check image status
kubectl get pods -n wajibika-mazingira -o jsonpath='{.items[*].status.containerStatuses[*]}'
```

### High CPU/Memory

```bash
# Check resource usage
kubectl top pods -n wajibika-mazingira

# Check HPA status
kubectl get hpa -n wajibika-mazingira -o wide

# Check current metrics
kubectl get hpa wajibika-frontend-hpa -n wajibika-mazingira --watch
```

### Can't access application

```bash
# Check service
kubectl get svc wajibika-frontend -n wajibika-mazingira

# Check ingress
kubectl get ingress -n wajibika-mazingira
kubectl describe ingress wajibika-ingress -n wajibika-mazingira

# Test connectivity
kubectl exec -it <pod-name> -n wajibika-mazingira -- sh
# Inside pod: wget http://wajibika-frontend
```

## 📚 Additional Resources

- **Full Documentation**: See `k8s/DEPLOYMENT.md`
- **Docker Compose Guide**: See `DOCKER_COMPOSE.md`
- **k3s Documentation**: https://docs.k3s.io/
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Kubectl Cheat Sheet**: https://kubernetes.io/docs/reference/kubectl/cheatsheet/

## 🆘 Help & Support

- Project Issues: https://github.com/WilliamMajanja/wajibika-mazingira/issues
- k3s GitHub: https://github.com/k3s-io/k3s
- Kubernetes Slack: https://kubernetes.slack.com/

---

**Quick Reference Commands Summary:**

```bash
# Deploy
bash k8s/deploy.sh

# Monitor
kubectl get pods -n wajibika-mazingira
kubectl logs -f deployment/wajibika-frontend -n wajibika-mazingira

# Access
kubectl port-forward -n wajibika-mazingira svc/wajibika-frontend 8080:80

# Scale
kubectl scale deployment wajibika-frontend --replicas=3 -n wajibika-mazingira

# Update
docker build -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest .
docker save wajibika-mazingira:frontend-latest | sudo k3s ctr images import -
kubectl rollout restart deployment/wajibika-frontend -n wajibika-mazingira

# Cleanup
bash k8s/cleanup.sh
```
