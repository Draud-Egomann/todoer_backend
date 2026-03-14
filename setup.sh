#!/bin/bash

# Todoer Backend Setup Script
# This script sets up the Go backend with all necessary dependencies

set -e

echo "🚀 Setting up Todoer Backend..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go 1.23+"
    exit 1
fi

echo "✅ Go is installed"

# Change to backend directory
cd "$(dirname "$0")"

echo "📦 Downloading dependencies..."
go mod download

echo "🔨 Building the application..."
go build -o todoer-backend -v

echo "✅ Setup complete!"
echo ""
echo "🚀 To run the server:"
echo "   ./todoer-backend"
echo ""
echo "📚 Swagger docs will be available at:"
echo "   http://localhost:3000/swagger/index.html"
echo ""
echo "🔐 Make sure to configure your API key in .env file:"
echo "   API_KEY=your-secure-key"
