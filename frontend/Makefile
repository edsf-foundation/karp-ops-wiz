.PHONY: install dev build lint test clean

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run linting
lint:
	npm run lint

# Run tests (when configured)
test:
	npm test

# Clean build artifacts
clean:
	rm -rf node_modules/
	rm -rf dist/

# Type checking
check:
	npx tsc --noEmit

# Development setup
dev-setup: install
	npm install -g @vue/cli

# Preview production build
preview:
	npm run preview

# Audit dependencies
audit:
	npm audit

# Update dependencies
update:
	npm update
