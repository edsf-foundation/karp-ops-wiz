# Contributing to KarpOps-Wiz

Thank you for your interest in contributing to KarpOps-Wiz! This document provides guidelines for contributors.

## Development Setup

### Prerequisites

- Go 1.21+
- Node.js 18+
- Docker
- Kubernetes cluster (for testing)
- Helm 3.x

### Backend Development

```bash
cd backend

# Install dependencies
make install

# Run locally
make run

# Run tests
make test

# Check code formatting
make fmt

# Run linting
make lint
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

### Docker Development

```bash
# Build Docker image
docker build -t karpops-wiz:dev .

# Run with Kubernetes config mounted
docker run -p 8080:8080 \
  -v ~/.kube/config:/root/.kube/config:ro \
  karpops-wiz:dev
```

### Testing with Helm

```bash
# Package Helm chart
helm package charts/karpops-wiz

# Install in local cluster
helm install karpops-wiz ./karpops-wiz-*.tgz \
  --set features.costDashboard.enabled=true \
  --set features.rebalancing.enabled=true
```

## Project Structure

```
karp-ops-wiz/
├── backend/                 # Go backend
│   ├── api/                # API handlers
│   ├── k8s/                # Kubernetes client
│   ├── wizard/             # Configuration wizard
│   └── main.go             # Entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utilities
│   │   └── ui/            # UI components
│   └── package.json
├── charts/                 # Helm charts
│   └── karpops-wiz/
├── data/                   # Static data (pricing)
├── scripts/

├── actions/               # GitHub Actions
│   └── workflows/
└── docs/
```

## Adding Features

### Backend Features

1. Create new handlers in `backend/api/`
2. Add business logic in `backend/wizard/`
3. Update Kubernetes client in `backend/k8s/`
4. Add comprehensive tests
5. Update API documentation

### Frontend Features

1. Create components in `frontend/src/components/`
2. Add UI components to `frontend/src/components/ui/`
3. Update routing in `App.tsx`
4. Add proper TypeScript types
5. Test responsive design

### Karpenter Integration

1. Follow Karpenter API standards
2. Support both v1beta1 and latest schemas
3. Validate configurations before generation
4. Provide clear error messages

## Testing Guidelines

### Backend Testing

- Unit tests for all business logic
- Integration tests for Kubernetes client
- Mock external dependencies
- Test error conditions

### Frontend Testing

- Component unit tests
- Integration tests for API calls
- Visual regression tests
- Accessibility testing

### End-to-End Testing

- Test full feature workflows
- Validate Helm chart installation
- Test with real Kubernetes clusters
- Performance testing

## Code Style

### Go Backend

- Use `gofmt` for formatting
- Follow Go conventions
- Use meaningful variable names
- Include comprehensive comments for complex logic
- Use interfaces for testability

### TypeScript/React Frontend

- Use Prettier for formatting
- Follow React best practices
- Use TypeScript strict mode
- Prefer functional components
- Use hooks appropriately

### YAML Configuration

- Follow Helm best practices
- Use consistent indentation
- Include resource limits
- Document all parameters

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Update documentation
6. Submit pull request

### PR Requirements

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated that
- [ ] No security vulnerabilities
- [ ] Helm chart versions updated
- [ ] Docker image builds successfully

## Release Process

1. Update version numbers in Chart.yaml
2. Update CHANGELOG.md
3. Create Git tag
4. GitHub Actions builds and releases
5. Helm chart published automatically

## Security Considerations

- Never commit secrets or credentials
- Use environment variables for configuration
- Follow Kubernetes security best practices
- Regularly update dependencies
- Use container security scanning

## Questions?

- Open an issue for bugs or questions
- Join our Discord/Slack for discussions
- Check existing issues before creating new ones

## Repository Information

- **Repository**: [https://github.com/edsf-foundation/karp-ops-wiz](https://github.com/edsf-foundation/karp-ops-wiz)
- **Organization**: EDSF Foundation
- **License**: MIT

Thank you for contributing! 🎉
