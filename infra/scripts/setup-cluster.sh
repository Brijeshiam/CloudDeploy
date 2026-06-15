#!/bin/bash
# =============================================================================
# CloudDeploy — Production Kubernetes Cluster Setup
# =============================================================================
# Run this on an existing K8s cluster (EKS, GKE, AKS, or bare metal)
# Prerequisites: kubectl (connected to cluster), helm 3.x
# =============================================================================

set -euo pipefail

INGRESS_NAMESPACE="ingress-nginx"
CERT_MANAGER_NAMESPACE="cert-manager"
MONITORING_NAMESPACE="monitoring"
CLOUDDEPLOY_NAMESPACE="clouddeploy-system"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@clouddeploy.com}"

echo "=============================================="
echo "  CloudDeploy — Cluster Setup Script"
echo "=============================================="
echo "  Cluster: $(kubectl config current-context)"
echo "=============================================="

# ---- Step 1: Install ingress-nginx ----
echo ""
echo "[1/5] Installing ingress-nginx..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx --force-update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace "${INGRESS_NAMESPACE}" \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.metrics.enabled=true \
  --set controller.metrics.serviceMonitor.enabled=true \
  --wait
echo "[✓] ingress-nginx installed"

# ---- Step 2: Install cert-manager ----
echo ""
echo "[2/5] Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io --force-update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace "${CERT_MANAGER_NAMESPACE}" \
  --create-namespace \
  --set crds.enabled=true \
  --wait
echo "[✓] cert-manager installed"

# ---- Step 3: Create ClusterIssuers ----
echo ""
echo "[3/5] Creating ClusterIssuers for Let's Encrypt..."
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${ADMIN_EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
echo "[✓] ClusterIssuer created"

# ---- Step 4: Install Prometheus + Grafana ----
echo ""
echo "[4/5] Installing Prometheus + Grafana..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace "${MONITORING_NAMESPACE}" \
  --create-namespace \
  --set grafana.adminPassword="${GRAFANA_PASSWORD:-clouddeploy_grafana_$(date +%s)}" \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --wait --timeout 10m
echo "[✓] Prometheus + Grafana installed"

# ---- Step 5: Create CloudDeploy system namespace ----
echo ""
echo "[5/5] Creating CloudDeploy system namespace..."
kubectl create namespace "${CLOUDDEPLOY_NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "${CLOUDDEPLOY_NAMESPACE}" \
  app.kubernetes.io/managed-by=clouddeploy \
  --overwrite
echo "[✓] Namespace ${CLOUDDEPLOY_NAMESPACE} ready"

# ---- Summary ----
echo ""
echo "=============================================="
echo "  Cluster Setup Complete!"
echo "=============================================="
INGRESS_IP=$(kubectl get svc -n "${INGRESS_NAMESPACE}" ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "<pending>")
echo ""
echo "  Ingress External IP: ${INGRESS_IP}"
echo "  → Point your wildcard DNS *.yourdomain.com to this IP"
echo ""
echo "  Next steps:"
echo "  1. Update BASE_DOMAIN in .env to your domain"
echo "  2. Deploy CloudDeploy backend + frontend to this cluster"
echo "  3. Or run locally: docker-compose up -d (points to this cluster)"
echo "=============================================="
