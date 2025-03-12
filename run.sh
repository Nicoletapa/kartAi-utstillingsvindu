#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Run the application (adjust the path as needed)
cd backend
uvicorn src.main:app --reload
