# Use the official Python image from Docker Hub
FROM --platform=linux/amd64 python:3.11-slim

# Set environment variables to prevent Python from buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create startup script
COPY start-backend.sh /app/start-backend.sh
RUN chmod +x /app/start-backend.sh

# Expose the application port
EXPOSE 8000

# Run the application (use Uvicorn instead of FastAPI directly)
CMD ["/app/start-backend.sh"]