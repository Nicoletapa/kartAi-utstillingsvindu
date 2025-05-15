import logging
from fastapi import FastAPI, Request
from fastapi import status
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from fastapi.responses import JSONResponse

# --- Import your routers ---
from src.api.routes import planprat
from src.services.agent_service import get_plan_agent
from src.utils.logging import setup_logging

# Set up logging
setup_logging()
logger = logging.getLogger(__name__)

# --- FastAPI App Initialization ---
app = FastAPI(
    title="KartAI API",
    description="API for KartAI application providing building regulations assistance",
    version="1.0.0"
)

# --- Store event loop on app state for run_in_executor ---
@app.on_event("startup")
async def startup_event():
    logger.info("Application startup...")
    app.state.loop = asyncio.get_running_loop()
    logger.info("Stored running event loop on app.state.loop")
    
    # Initialize the plan agent at startup
    get_plan_agent()  # This now calls the function from agent_service.py
    logger.info("PlanAgent initialized at startup")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutdown...")
    # Cleanup if needed


# --- Configure CORS ---
ORIGINS = [
    "http://localhost:3000",
    "http://localhost:80",
    "http://api:8000"
    "http://localhost",
    # Add your deployed frontend origin here eventually
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True, 
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*", "X-User-Session-Token"], 
)

# --- Include Routers ---
app.include_router(planprat.router, prefix="/api", tags=["planning"]) 


# --- Health Check ---
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    logger.debug("Health check requested")
    return {"status": "healthy"}

# Optional: Add a root endpoint for basic testing
@app.get("/", tags=["root"])
async def read_root():
    return {"message": "Welcome to KartAI API"}