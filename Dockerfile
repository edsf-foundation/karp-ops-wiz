# Multi-stage build for Go backend + React frontend

# Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ .
RUN npm run build

# Build backend
FROM golang:1.21-alpine AS backend-build
WORKDIR /app
RUN apk add --no-cache ca-certificates git
# Copy only go.mod first to leverage layer caching (no go.sum in repo yet)
COPY go.mod ./
RUN go mod download
# Copy backend sources and build
COPY backend/ ./backend
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /main ./backend

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates kubectl tzdata
WORKDIR /root/

# Copy backend binary
COPY --from=backend-build /main .

# Copy frontend build
COPY --from=frontend-build /frontend/dist ./frontend/dist

# Copy AWS pricing data
COPY data/aws-pricing.json ./data/

# Copy entrypoint script
COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
CMD ["./main"]
