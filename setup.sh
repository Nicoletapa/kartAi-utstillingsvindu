#!/bin/bash

if [ ! -d "venv" ]; then
    python -m venv venv
fi

# Detect platform and use correct activation path
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

pip install -r backend/requirements.txt
cd backend
uvicorn src.main:app --reload


