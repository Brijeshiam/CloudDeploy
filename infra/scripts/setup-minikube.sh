#!/bin/bash
# =============================================================================
# CloudDeploy — Local Kubernetes Setup with Minikube
# =============================================================================
# Run this script once to set up your local development Kubernetes cluster.
# Prerequisites: minikube, kubectl, helm installed
# =============================================================================

set -euo pipefail

MINIKUBE_CPUS=${MINIKUBE_CPUS:-4}
MINIKUBE_MEMORY=${MINIKUBE_MEMORY:-8192}
MINIKUBE_DISK_SIZE=${MINIKUBE_DISK_SIZE:-30g}

echo "=============================================="
echo "  CloudDeploy — Minikube Setup Script"
echo "=============================================="

# ---- Step 1: Start Minikube ----
echo ""
echo "[1/6] Starting Minikube..."
minikube start \
  --cpus="${MINIKUBE_CPUS}" \
  --memory="${MINIKUBE_MEMORY}" \
  --disk-size="${MINIKUBE_DISK_SIZE}" \
  --driver=docker \
  --kubernetes-version=stable

echo "[✓] Minikube started"

# ---- Step 2: Enable Addons ----
echo ""
echo "[2/6] Enabling Minikube addons..."
minikube addons enable ingress
minikube addons enable ingress-dns
minikube addons enable metrics-server
minikube addons enable dashboard
echo "[✓] Addons enabled: ingress, ingress-dns, metrics-server, dashboard"

# ---- Step 3: Install cert-manager ----
echo ""
echo "[3/6] Installing cert-manager..."
helm repo add jetstack https://charts.jetstack.io --force-update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true \
  --wait
echo "[✓] cert-manager installed"

# ---- Step 4: Create ClusterIssuers ----
echo ""
echo "[4/6] Creating cert-manager ClusterIssuers..."
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@clouddeploy.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@clouddeploy.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
echo "[✓] ClusterIssuers created"

# ---- Step 5: Install Prometheus + Grafana ----
echo ""
echo "[5/6] Installing Prometheus + Grafana (kube-prometheus-stack)..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts --force-update
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=clouddeploy_grafana \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --wait --timeout 10m
echo "[✓] Prometheus + Grafana installed"

# ---- Step 6: Print Summary ----
echo ""
echo "=============================================="
echo "  Setup Complete!"
echo "=============================================="
echo ""
echo "  Minikube IP: $(minikube ip)"
echo "  Dashboard:   minikube dashboard"
echo ""
echo "  Prometheus:  kubectl port-forward -n monitoring svc/kube-prometheus-stack-prometheus 9090:9090"
echo "  Grafana:     kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3001:80"
echo "  Grafana login: admin / clouddeploy_grafana"
echo ""
echo "  Add to /etc/hosts (or C:\\Windows\\System32\\drivers\\etc\\hosts):"
echo "  $(minikube ip)  *.clouddeploy.local"
echo ""
echo "  Next: cp .env.example .env && edit .env, then: docker-compose up -d"
echo "=============================================="
