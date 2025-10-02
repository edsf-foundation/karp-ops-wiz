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
WORKDIR /backend
RUN apk add --no-cache ca-certificates git
COPY go.mod go.sum ./
RUN go mod download
COPY backend/ . 
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates kubectl tzdata
WORKDIR /root/

# Copy backend binary
COPY --from=backend-build /backend/main .

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
