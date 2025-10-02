#!/bin/bash

set -e

# KarpOps-Wiz Installation Script
# This script helps install KarpOps-Wiz in your Kubernetes cluster

echo "🚀 KarpOps-Wiz Installation Script"
echo "================================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if helm is available
if ! command -v helm &> /dev/null; then
    echo "❌ helm is not installed or not in PATH"
    exit 1
fi

# Check cluster connectivity
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Kubernetes cluster connection verified"

# Create namespace if it doesn't exist
echo "📦 Creating namespace 'karpops-wiz'..."
kubectl create namespace karpops-wiz --dry-run=client -o yaml | kubectl apply -f -

# Add Helm repository
echo "📚 Adding Helm repository..."
helm repo add karpops https://raw.githubusercontent.com/edsf-foundation/karp-ops-wiz/main/charts
helm repo update

# Check if Karpenter is installed
echo "🔍 Checking Karpenter installation..."
if kubectl get crd ec2nodeclasses.karpenter.k8s.aws &> /dev/null; then
    echo "✅ Karpenter CRDs found"
    KARPENTER_ENABLED=true
else
    echo "⚠️  Karpenter CRDs not found - some features will be disabled"
    KARPENTER_ENABLED=false
fi

# Prepare values file
cat > karpops-values.yaml << EOF
features:
  costDashboard:
    enabled: true
  rebalancing:
    enabled: true
  pricingSimulation:
    enabled: true
  karpenterIntegration:
    enabled: $KARPENTER_ENABLED

# Security context
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

# Resource limits
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

# Service configuration
service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
EOF

# Install KarpOps-Wiz
echo "⬇️  Installing KarpOps-Wiz..."
helm install karpops-wiz karpops/karpops-wiz \
    --namespace karpops-wiz \
    --values karpops-values.yaml \
    --wait

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/karpops-wiz -n karpops-wiz

# Get service information
echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo ""

# Check if service is available
SERVICE_NAME=$(kubectl get svc -n karpops-wiz -o jsonpath='{.items[0].metadata.name}')
SERVICE_PORT=$(kubectl get svc -n karpops-wiz -o jsonpath='{.items[0].spec.ports[0].port}')

if kubectl get ingress -n karpops-wiz &> /dev/null; then
    INGRESS_HOST=$(kubectl get ingress -n karpops-wiz -o jsonpath='{.items[0].spec.rules[0].host}')
    echo "🌐 Access KarpOps-Wiz at: http://$INGRESS_HOST"
else
    echo "🔗 To access KarpOps-Wiz, use port-forward:"
    echo "   kubectl port-forward svc/$SERVICE_NAME $SERVICE_PORT:80 -n karpops-wiz"
    echo ""
    echo "   Then open: http://localhost:$SERVICE_PORT"
fi

echo ""
echo "📚 Documentation: https://github.com/edsf-foundation/karp-ops-wiz"
echo "🐛 Report issues: https://github.com/edsf-foundation/karp-ops-wiz/issues"

# Cleanup
rm -f karpops-values.yaml

echo ""
echo "✨ Enjoy optimizing your Kubernetes costs with KarpOps-Wiz!"
