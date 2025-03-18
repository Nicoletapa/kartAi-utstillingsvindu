#!/bin/bash

# To active virtual environment on Linux/macOS
# source venv/bin/activate

# To activate virtual environment on Windows
source venv/Scripts/activate

# Run the application (adjust the path as needed)
cd backend
uvicorn src.main:app --reload
