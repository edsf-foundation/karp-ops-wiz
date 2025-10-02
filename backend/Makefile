.PHONY: build run test clean docker-build

# Build the application
build:
	go build -o bin/main ./main.go

# Run the application locally
run:
	go run main.go

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

# Clean build artifacts
clean:
	rm -rf bin/

# Build Docker image locally
docker-build:
	docker build -t karpops-wiz:local .

# Run application in Docker locally
docker-run:
	docker run -p 8080:8080 \
		-v ~/.kube/config:/root/.kube/config:ro \
		karpops-wiz:local

# Generate dependency graph
deps:
	go mod graph

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Install dependencies
install:
	go mod download
	go mod tidy

# Development setup
dev-setup: install
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Health check
health:
	curl http://localhost:8080/health

# Generate API docs (if using swagger)
docs:
	go install github.com/swaggo/swag/cmd/swag@latest
	swag init -g main.go
