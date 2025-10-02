# KarpOps-Wiz Quick Start Guide

🚀 **Get started with Kubernetes cost optimization in 5 minutes!**

## Prerequisites

- Kubernetes cluster with kubectl access
- Helm 3.x installed
- Karpenter installed (optional but recommended)

## Option 1: Install via Script (Recommended)

```bash
# Clone the repository
git clone https://github.com/edsf-foundation/karp-ops-wiz.git
cd karp-ops-wiz

# Run the installer script
chmod +x scripts/install.sh
./scripts/install.sh
```

## Option 2: Install via Helm

```bash
# Add Helm repository
helm repo add karpops https://raw.githubusercontent.com/edsf-foundation/karp-ops-wiz/main/charts
helm repo update

# Install KarpOps-Wiz
helm install karpops-wiz karpops/karpops-wiz \
  --namespace karpops-wiz \
  --create-namespace \
  --set features.costDashboard.enabled=true \
  --set features.rebalancing.enabled=true \
  --set features.pricingSimulation.enabled=true
```

## Option 3: Development Setup

### Backend
```bash
cd backend
make install
make run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` and backend at `http://localhost:8080`

## Access Your Installation

### Port Forward (Local Access)
```bash
kubectl port-forward svc/karpops-wiz 8080:80 -n karpops-wiz
```

Then open: `http://localhost:8080`

### Ingress (Production)
Enable ingress in your values:

```yaml
ingress:
  enabled: true
  hosts:
    - host: karpops-wiz.yourdomain.com
      paths:
        - path: /
          pathType: Prefix
```

## First Steps

1. **Check Dashboard**: View your current cluster costs and utilization
2. **Generate Config**: Use the Karpenter Config Wizard to create optimized configurations
3. **Apply Recommendations**: Review and apply cost optimization suggestions
4. **Monitor Savings**: Track your cost reduction over time

## Feature Flags

Control which features to enable:

```yaml
features:
  costDashboard:
    enabled: true      # Cost monitoring dashboard
  rebalancing:
    enabled: true      # Rebalancing recommendations  
  pricingSimulation:
    enabled: true      # Cost estimation
  karpenterIntegration:
    enabled: true      # Karpenter config wizard
```

## Troubleshooting

### Can't Connect to Cluster
```bash
kubectl cluster-info
kubectl get nodes
```

### Missing Karpenter CRDs
```bash
kubectl get crd | grep karpenter
# Install Karpenter first: https://karpenter.sh/docs/getting-started/
```

### Service Won't Start
```bash
kubectl logs -f deployment/karpops-wiz -n karpops-wiz
kubectl describe pod -l app=karpops-wiz -n karpops-wiz
```

### Permissions Issues
```bash
kubectl auth can-i get nodes --as=system:serviceaccount:karpops-wiz:karpops-wiz
```

## Next Steps

- 📖 Read the [full documentation](README.md)
- 🛠️ [Contribute](CONTRIBUTING.md) to the project
- 🐛 [Report bugs](https://github.com/edsf-foundation/karp-ops-wiz/issues)
- 💡 [Suggest features](https://github.com/edsf-foundation/karp-ops-wiz/issues/new?template=feature_request.md)

## Need Help?

- 📚 [Documentation](README.md)
- 💬 [Discord Support](https://discord.gg/karpops-wiz)
- 📧 [Email Support](mailto:support@karpops-wiz.com)
- 🎥 [Video Tutorials](https://youtube.com/karpops-wiz)

---

**Happy cost optimizing! 💰🚀**
