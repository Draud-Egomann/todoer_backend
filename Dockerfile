# Build stage
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o todoer-backend .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS and sqlite
RUN apk --no-cache add ca-certificates sqlite-libs

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/todoer-backend .

# Create a data directory for the database
RUN mkdir -p /root/data

# Copy .env file if it exists
COPY .env .env

# Expose port
EXPOSE 3000

# Run the application
CMD ["./todoer-backend"]
