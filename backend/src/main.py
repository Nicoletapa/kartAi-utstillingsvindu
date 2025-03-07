import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import planprat
from src.utils.logging import setup_logging

# Set up logging
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KartAI API",
    description="API for KartAI application providing building regulations assistance",
    version="1.0.0"
)

# Configure CORS
ORIGINS = [
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(planprat.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}