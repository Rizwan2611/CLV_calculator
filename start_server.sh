#!/bin/bash

echo "🎯 CLV Calculator - Full Stack Setup"
echo "===================================="
echo ""

# Load environment variables if .env exists
if [ -f ./.env ]; then
    echo "🔧 Loading environment variables from .env"
    set -a
    source ./.env
    set +a
fi

# Determine port for display (Render provides PORT; locally default to 8080)
DISPLAY_PORT=${PORT:-8080}

# Navigate to backend directory
cd Backend

echo "📦 Building the server..."
make clean
make

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🚀 Starting the CLV Server..."
    echo "   - Backend API: http://localhost:${DISPLAY_PORT}/api/"
    echo "   - Frontend: http://localhost:${DISPLAY_PORT}/"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Start the server
    ./clv-server
else
    echo "❌ Build failed!"
    exit 1
fi
