# Kubernetes Deployment Guide for Wajibika Mazingira using k3s

## Overview

This guide provides comprehensive instructions for deploying the Wajibika Mazingira application on a self-hosted Kubernetes cluster using **k3s** (lightweight Kubernetes distribution).

The deployment includes:
- **Frontend**: React application served via Nginx
- **Backend**: Express.js PDF generation server
- **Ingress**: Traefik ingress controller (pre-installed with k3s)
- **Auto-scaling**: Horizontal Pod Autoscaler for both services
- **Security**: Network policies, security contexts, and pod anti-affinity

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+, CentOS 8+, or equivalent)
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended for production)
- **Storage**: 20GB+ available disk space
- **Network**: Static IP address (for production)

### Software Requirements

- `kubectl` (Kubernetes CLI)
- `docker` or `podman` (for building container images)
- `curl` or `wget` (for downloading scripts)

## Installation Steps

### 1. Install k3s

k3s is a lightweight Kubernetes distribution perfect for self-hosting. Install it on your server:

```bash
# For development/single-node setup
curl -sfL https://get.k3s.io | sh -

# For a more controlled installation
curl -sfL https://get.k3s.io | INSTALL_K3S_CHANNEL=stable sh -

# Verify installation
sudo k3s kubectl get nodes
```

#### With specific configuration (recommended):

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable=traefik" sh -
```

This disables the default Traefik if you want to use a different ingress controller.

### 2. Configure kubectl

```bash
# Make kubeconfig accessible without sudo
sudo chmod 644 /etc/rancher/k3s/k3s.yaml

# Set KUBECONFIG environment variable
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
echo "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" >> ~/.bashrc

# Verify connection
kubectl get nodes
```

### 3. Build Docker Images

Navigate to the project directory and build the container images:

```bash
cd /path/to/wajibika-mazingira

# Build frontend image
docker build -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest .

# Build backend image
docker build -f Dockerfile.server -t wajibika-mazingira:server-latest .

# List built images
docker images | grep wajibika
```

#### Loading images into k3s

If using containerd (default with k3s):

```bash
# Using docker buildx to build directly for containerd
docker buildx build --platform linux/amd64 -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest .

# Or load manually
docker save wajibika-mazingira:frontend-latest | sudo k3s ctr images import -

# Verify images in k3s
sudo k3s ctr images ls | grep wajibika
```

### 4. Deploy to k3s

#### Create the namespace and deploy resources:

```bash
# Apply namespace and deployments
kubectl apply -f k8s/deployment.yaml

# Apply configuration
kubectl apply -f k8s/config.yaml

# Apply ingress rules
kubectl apply -f k8s/ingress.yaml

# Verify deployments
kubectl get deployments -n wajibika-mazingira
kubectl get pods -n wajibika-mazingira
kubectl get svc -n wajibika-mazingira
```

#### Monitor rollout:

```bash
# Watch frontend deployment
kubectl rollout status deployment/wajibika-frontend -n wajibika-mazingira

# Watch backend deployment
kubectl rollout status deployment/wajibika-server -n wajibika-mazingira
```

### 5. Configure DNS and Ingress

#### For local/development setup:

Add to your `/etc/hosts`:
```
127.0.0.1 mazingira.local
```

#### For production:

1. Update the ingress hostname in `k8s/ingress.yaml`:
```yaml
rules:
- host: yourdomain.com
```

2. Configure DNS to point to your k3s server IP

3. Install cert-manager for Let's Encrypt TLS:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s

# Apply ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF
```

### 6. Access the Application

#### Local access:
```bash
# Port forward to access locally
kubectl port-forward -n wajibika-mazingira svc/wajibika-frontend 8080:80

# Open browser to http://localhost:8080/wajibika-mazingira/
```

#### Production access:
- Navigate to: `https://yourdomain.com/wajibika-mazingira/`

## Common Operations

### View Application Logs

```bash
# Frontend logs
kubectl logs -n wajibika-mazingira deployment/wajibika-frontend -f

# Backend logs
kubectl logs -n wajibika-mazingira deployment/wajibika-server -f

# All pods in the namespace
kubectl logs -n wajibika-mazingira -f -l app=wajibika-frontend
```

### Scale Deployments

```bash
# Manually scale frontend
kubectl scale deployment wajibika-frontend --replicas=3 -n wajibika-mazingira

# Manually scale backend
kubectl scale deployment wajibika-server --replicas=3 -n wajibika-mazingira
```

### Update Container Images

```bash
# Rebuild images
docker build -f Dockerfile.frontend -t wajibika-mazingira:frontend-latest .
docker build -f Dockerfile.server -t wajibika-mazingira:server-latest .

# Trigger rollout restart
kubectl rollout restart deployment/wajibika-frontend -n wajibika-mazingira
kubectl rollout restart deployment/wajibika-server -n wajibika-mazingira
```

### Check Pod Status

```bash
# Get detailed pod information
kubectl describe pod <pod-name> -n wajibika-mazingira

# Get resource usage
kubectl top nodes
kubectl top pods -n wajibika-mazingira
```

### Check Ingress Status

```bash
# Get ingress details
kubectl describe ingress wajibika-ingress -n wajibika-mazingira

# Get ingress IP/hostname
kubectl get ingress -n wajibika-mazingira -o wide
```

## Scaling and Auto-scaling

The deployment includes **Horizontal Pod Autoscaler (HPA)** configuration:

- **Frontend**: Scales from 2-5 replicas based on CPU (70%) and memory (80%) utilization
- **Backend**: Scales from 2-5 replicas based on CPU (75%) and memory (85%) utilization

To enable metrics collection (required for HPA):

```bash
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify HPA is working
kubectl get hpa -n wajibika-mazingira
```

## Storage and Persistence

Current configuration uses temporary storage (`emptyDir`). For production with data persistence:

```bash
# Create a PersistentVolume
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolume
metadata:
  name: wajibika-data-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: /mnt/wajibika-data
EOF

# Create a PersistentVolumeClaim
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wajibika-data-pvc
  namespace: wajibika-mazingira
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF
```

## Monitoring and Observability

### Check Cluster Status

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes -o wide

# Namespace resources
kubectl get all -n wajibika-mazingira

# Resource quotas
kubectl describe resourcequota -n wajibika-mazingira
```

### View Events

```bash
# Recent events
kubectl get events -n wajibika-mazingira --sort-by='.lastTimestamp'

# Watch events
kubectl get events -n wajibika-mazingira --watch
```

### Optional: Install Prometheus & Grafana

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Access Grafana dashboard
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

## Security Considerations

### Network Policies

The deployment includes network policies that restrict traffic:
- Pods can communicate within the namespace
- DNS traffic is allowed for external resolution

### Pod Security Context

Both deployments run with:
- Non-root users
- Read-only root filesystem
- No privilege escalation
- Dropped capabilities

### RBAC (Role-Based Access Control)

```bash
# Create limited service account for deployments
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: wajibika-sa
  namespace: wajibika-mazingira
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: wajibika-role
  namespace: wajibika-mazingira
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: wajibika-rolebinding
  namespace: wajibika-mazingira
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: wajibika-role
subjects:
- kind: ServiceAccount
  name: wajibika-sa
  namespace: wajibika-mazingira
EOF
```

## Troubleshooting

### Pod won't start

```bash
# Check pod status and events
kubectl describe pod <pod-name> -n wajibika-mazingira

# Check container logs
kubectl logs <pod-name> -n wajibika-mazingira

# Common issues:
# - Image not found: Verify image exists in container registry
# - Resource limits: Increase requested resources
# - Security context: Check permissions
```

### High CPU/Memory usage

```bash
# Monitor resource usage
kubectl top pods -n wajibika-mazingira --sort-by=cpu
kubectl top pods -n wajibika-mazingira --sort-by=memory

# Adjust resource limits in deployment.yaml
# Increase HPA thresholds if scaling isn't aggressive enough
```

### Ingress not working

```bash
# Check ingress status
kubectl describe ingress wajibika-ingress -n wajibika-mazingira

# Verify Traefik is running
kubectl get deployments -n kube-system | grep traefik

# Check service endpoints
kubectl get endpoints -n wajibika-mazingira
```

### Lost connectivity

```bash
# Verify network policies aren't blocking traffic
kubectl get networkpolicy -n wajibika-mazingira

# Test DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup wajibika-frontend
```

## Backup and Recovery

### Backup Configuration

```bash
# Export deployments
kubectl get deployments -n wajibika-mazingira -o yaml > deployment-backup.yaml

# Export entire namespace
kubectl get all -n wajibika-mazingira -o yaml > namespace-backup.yaml

# Backup etcd (k3s data)
sudo k3s etcd-snapshot save --name=wajibika-backup
```

### Restore Configuration

```bash
# Restore from backup
kubectl apply -f deployment-backup.yaml

# Restore etcd (requires k3s restart)
sudo k3s server --cluster-reset-restore-path=/var/lib/rancher/k3s/server/db/snapshots/wajibika-backup
```

## Performance Tuning

### Optimize k3s

```bash
# Edit k3s configuration
sudo vi /etc/systemd/system/k3s.service

# Useful flags:
# --kube-controller-manager-arg feature-gates=PodPriority=true
# --kube-apiserver-arg max-requests-inflight=800
```

### Resource Requests and Limits

Adjust in `k8s/deployment.yaml`:
```yaml
resources:
  requests:
    memory: "128Mi"  # Increase for demanding apps
    cpu: "200m"
  limits:
    memory: "512Mi"
    cpu: "1000m"
```

## Uninstall k3s

```bash
# Remove k3s cluster
/usr/local/bin/k3s-uninstall.sh

# Clean up k3s data
sudo rm -rf /var/lib/rancher/k3s
```

## Additional Resources

- [k3s Documentation](https://docs.k3s.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Traefik Documentation](https://doc.traefik.io/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## Support and Troubleshooting

For project-specific issues:
- GitHub Issues: https://github.com/WilliamMajanja/wajibika-mazingira/issues
- Documentation: See README.md for application features

For k3s-specific issues:
- k3s GitHub: https://github.com/k3s-io/k3s/issues
- k3s Slack community
