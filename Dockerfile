# Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev git

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Tidy go modules
RUN go mod tidy

# Install swag CLI and generate swagger docs
RUN go install github.com/swaggo/swag/cmd/swag@latest && swag init

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o todoer-backend .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS and sqlite
RUN apk --no-cache add ca-certificates sqlite-libs

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/todoer-backend .

# Copy swagger docs from builder
COPY --from=builder /app/docs ./docs

# Create a data directory for the database
RUN mkdir -p /root/data

# Copy .env file if it exists
COPY .env .env

# Expose port
EXPOSE 3000

# Run the application
CMD ["./todoer-backend"]
