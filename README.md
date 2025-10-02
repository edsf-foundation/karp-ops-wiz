# KarpOps-Wiz: Kubernetes Cost Optimization Tool

An open-source MVP inspired by CAST AI, focused on Karpenter-based scaling and cost optimization.

## Features

- **Karpenter Config Wizard**: Generate optimized Provisioner + NodeTemplate configs for AWS
- **Cost Optimization Dashboard**: Visualize current vs projected cluster costs
- **Rebalancing Options**: Smart recommendations for instance types and pod placement
- **Helm Deployment**: Easy installation with feature flags

## Quick Start

### Install via Helm

```bash
helm repo add karpops https://raw.githubusercontent.com/edsf-foundation/karp-ops-wiz/main/charts
helm install karpops-wiz karpops/karpops-wiz
```

### Enable Feature Flags

```yaml
cost-dashboard:
  enabled: true
rebalancing:
  enabled: true
pricing-simulation:
  enabled: true
```

## Architecture

- **Backend**: Go with Kubernetes client-go
- **Frontend**: React + Tailwind + shadcn/ui
- **Charts**: Recharts for visualizations
- **Deployment**: Containerized and deployed via Helm

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup.

## License

MIT License
