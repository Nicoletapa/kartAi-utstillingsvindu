#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi
echo "Setup complete! Activate the environment with: source venv/bin/activate"
# Activate virtual environment on macOS/Linux
source venv/bin/activate
# To activate virtual environment on Windows
#source venv/Scripts/activate
pip install -r backend/requirements.txt

# Run the application (adjust the path as needed)
cd backend
uvicorn src.main:app --reload


# Install dependencies


