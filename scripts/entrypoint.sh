#!/bin/sh

# Wait for Kubernetes API to be available
echo "Waiting for Kubernetes API..."
until kubectl cluster-info >/dev/null 2>&1; do
    echo "Kubernetes API not ready, waiting..."
    sleep 5
done
echo "Kubernetes API is ready!"

# Verify Karpenter is installed
echo "Checking Karpenter installation..."
if kubectl get crd nodeclasss.karpenter.k8s.aws >/dev/null 2>&1; then
    echo "Karpenter CRDs found, proceeding..."
else
    echo "WARNING: Karpenter CRDs not found. Some features may not work."
fi

# Run the application
echo "Starting KarpOps-Wiz..."
exec "$@"
