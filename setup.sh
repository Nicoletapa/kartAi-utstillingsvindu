#!/bin/bash

if [ ! -d "venv" ]; then
    python -m venv venv
fi

echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

echo "Installing Python dependencies..."
# Install base requirements
pip install -r backend/requirements.txt
cd backend
uvicorn src.main:app --reload


if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "Installing Windows-specific magic library..."
    pip install python-magic-bin
else
    echo "Installing Unix magic library..."
    pip install python-magic
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null && ! brew list libmagic &> /dev/null; then
            echo "Installing libmagic via Homebrew..."
            brew install libmagic
        fi
    fi
fi

echo "Setting up Prisma database..."
cd webapp  

if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in webapp directory"
    echo "Current directory: $(pwd)"
    echo "Contents: $(ls -la)"
    exit 1
fi

echo "Installing webapp dependencies..."
npm install

echo "Running Prisma migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

echo "Seeding database..."
if npm run db:seed; then
    echo "✅ Database seeding completed"
else
    echo "⚠️ Database seeding failed (this might be okay if no seed script exists)"
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Initializing vector database..."
cd ../backend  # Go to backend from webapp
python -m src.create_database

echo "Setup complete! Starting the application..."
uvicorn src.main:app --reload