#!/bin/bash
set -e

echo "Starting backend..."

# Initialize vector database if needed
if [ ! -d "/app/src/chroma" ]; then
    echo "Initializing vector database..."
    python -m src.create_database || echo "Vector DB initialization failed"
fi

# Start the FastAPI application
echo "Starting FastAPI application..."
exec uvicorn src.main:app --host 0.0.0.0 --port 8000 --proxy-headers