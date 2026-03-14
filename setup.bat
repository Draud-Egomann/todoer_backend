@echo off
REM Todoer Backend Setup Script for Windows
REM This script sets up the Go backend with all necessary dependencies

echo 🚀 Setting up Todoer Backend...

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Go is not installed. Please install Go 1.23+
    exit /b 1
)

echo ✅ Go is installed

echo 📦 Downloading dependencies...
go mod download
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to download dependencies
    exit /b 1
)

echo 🔨 Building the application...
go build -o todoer-backend.exe -v
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to build application
    exit /b 1
)

echo ✅ Setup complete!
echo.
echo 🚀 To run the server:
echo    todoer-backend.exe
echo.
echo 📚 Swagger docs will be available at:
echo    http://localhost:3000/swagger/index.html
echo.
echo 🔐 Make sure to configure your API key in .env file:
echo    API_KEY=your-secure-key
