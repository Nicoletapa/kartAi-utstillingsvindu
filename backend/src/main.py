import logging
from fastapi import FastAPI, HTTPException
from fastapi import status
from fastapi.middleware.cors import CORSMiddleware
from backend.src.types import PlanPratRequest, PlanPratResponse
from src.services.agent import invoke_plan_agent

app = FastAPI(
    title="KPRO API AI system",
    description="Retrieves text from user and returns an answer based on building regulations.",
    version="1.0.0",
)

ORIGINS = [
    "http://localhost:3000",
    "http://localhost:80",
    "http://localhost",
]
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


logging.basicConfig(filename="summary-assistant.log", level=logging.INFO)
logger = logging.getLogger(__name__)





import re
from src.services.document_services.spatial_retriever import SpatialDocumentRetriever

# Initialize services after the app definition
spatial_retriever = SpatialDocumentRetriever()

@app.post("/plan-prat", response_model=PlanPratResponse)
def plan_prat(request: PlanPratRequest) -> PlanPratResponse:
    """
    PlanPrat a query.

    Args:
        question (PlanPratRequest): The query to PlanPrat.
    Returns:
        PlanPratResponse: The PlanPrat response.
    """
    query = request.query
    logger.info(f"Query: {query}")
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query is empty"
        )

    # Extract any spatial context from the query (coordinates or polygon)
    map_coordinates = extract_map_coordinates(query)
    
    # If we have spatial information, retrieve relevant documents
    spatial_context = ""
    if map_coordinates:
        lat, lng = map_coordinates
        spatial_docs = spatial_retriever.get_documents_for_coordinates(lat, lng)
        if spatial_docs:
            doc_titles = ", ".join([doc['title'] for doc in spatial_docs])
            spatial_context = f"Retrieved {len(spatial_docs)} relevant documents for the location: {doc_titles}"
    
    logger.info(f"Spatial context: {spatial_context}")
    
    # Process with the agent
    response = invoke_plan_agent(query)
    
    # Handle response format based on type
    if isinstance(response, dict) and "answer" in response:
        # New format with guide buttons
        return PlanPratResponse(
            answer=response["answer"], 
            guides=response.get("guides", []),
            sources=spatial_context if spatial_context else "General knowledge"
        )
    else:
        # Legacy format (string only)
        return PlanPratResponse(
            answer=response,
            sources=spatial_context if spatial_context else "General knowledge"
        )

def extract_map_coordinates(query: str):
    """Extract map coordinates from query context."""
    try:
        # Look for patterns like [Map context: User is viewing map at coordinates 58.12345, 7.98765, zoom level 15]
        coordinates_pattern = r'coordinates\s+(\d+\.\d+),\s*(\d+\.\d+)'
        match = re.search(coordinates_pattern, query)
        
        if match:
            lat = float(match.group(1))
            lng = float(match.group(2))
            return (lat, lng)
    except Exception as e:
        logger.error(f"Error extracting map coordinates: {e}")
    
    return None

@app.get("/health")
def health_check():
    return {"status": "ok"}
