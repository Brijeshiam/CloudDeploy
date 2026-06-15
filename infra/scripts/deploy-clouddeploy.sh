#!/bin/bash
# =============================================================================
# CloudDeploy — Deployment Script for Kubernetes Cluster
# =============================================================================
# Builds the frontend/backend images and deploys the entire stack to the cluster.
# Usage:
#   bash infra/scripts/deploy-clouddeploy.sh
# =============================================================================

set -euo pipefail

NAMESPACE="clouddeploy-system"

echo "=============================================="
echo "  CloudDeploy — Deployment Orchestrator"
echo "=============================================="

# ---- Step 1: Detect Minikube context ----
IS_MINIKUBE=false
CURRENT_CONTEXT=$(kubectl config current-context)
if [[ "${CURRENT_CONTEXT}" == "minikube" ]]; then
  IS_MINIKUBE=true
  echo "[i] Minikube cluster detected. Reusing Minikube's Docker daemon..."
  eval $(minikube -p minikube docker-env)
fi

# ---- Step 2: Build Images ----
echo ""
echo "[1/4] Building Backend Image..."
docker build -t clouddeploy-backend:latest ./backend

echo ""
echo "[2/4] Building Frontend Image..."
docker build -t clouddeploy-frontend:latest ./frontend

echo "[✓] Docker images built successfully"

# ---- Step 3: Apply Kubernetes Manifests ----
echo ""
echo "[3/4] Creating system namespace..."
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "${NAMESPACE}" app.kubernetes.io/managed-by=clouddeploy --overwrite

echo ""
echo "[4/4] Applying Kubernetes resources..."
kubectl apply -f infra/k8s/system/mongo.yaml
kubectl apply -f infra/k8s/system/redis.yaml
kubectl apply -f infra/k8s/system/backend.yaml
kubectl apply -f infra/k8s/system/frontend.yaml
kubectl apply -f infra/k8s/system/ingress.yaml

echo "[✓] Manifests applied to cluster"

# ---- Step 4: Print Access Instructions ----
echo ""
echo "=============================================="
echo "  CloudDeploy deployed successfully!"
echo "=============================================="
if [ "$IS_MINIKUBE" = true ]; then
  IP=$(minikube ip)
  echo "  Minikube IP: ${IP}"
  echo "  Add this domain entry to your hosts file:"
  echo "  ${IP}  app.clouddeploy.local"
  echo ""
  echo "  Open the dashboard at: http://app.clouddeploy.local"
else
  echo "  Verify your Ingress External IP using:"
  echo "  kubectl get ingress -n ${NAMESPACE} clouddeploy-ingress"
fi
echo "=============================================="
