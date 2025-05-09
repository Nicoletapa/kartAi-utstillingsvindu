from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging
# Update this import to use the new service file

from src.services.agent_service import get_plan_agent
logger = logging.getLogger(__name__)

# Define request/response models
class PlanPratRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    spatial_data: Optional[Dict[str, Any]] = None

class GuideItem(BaseModel):
    title: str
    url: str
    description: Optional[str] = None

class PlanPratResponse(BaseModel):
    answer: str
    guides: Optional[List[GuideItem]] = []

# Update: Use consistent path naming (no hyphens)
router = APIRouter(prefix="/plan-prat", tags=["planning"])

@router.post("", response_model=PlanPratResponse)
async def plan_prat(request: PlanPratRequest) -> PlanPratResponse:
    """Handle plan chat queries with optional spatial data."""
    if not request.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query is empty"
        )
    
    # Get the plan agent instance from the service
    agent = get_plan_agent()
    try:
        # Process the query with spatial data if available
        if request.spatial_data:
            logger.info(f"Processing query with spatial data: {request.query[:50]}...")
            result = agent.process(request.query, spatial_data=request.spatial_data, user_id=request.user_id)
        else:
            logger.info(f"Processing query without spatial data: {request.query[:50]}...")
            result = agent.process(request.query, user_id=request.user_id)
        
        # Check if this is a form response
        if isinstance(result, dict) and "form_state" in result:
            # Special handling for form responses
            form_state = result.pop("form_state")
            answer = result.get("answer", "")
            # Store form state if needed
            # ... your existing form state handling ...
        
        return result
    except Exception as e:
        logger.error(f"Error processing planprat query: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process request"
        )

# Add a POST endpoint that accepts a JSON body for compatibility with frontend
@router.post("/query")
async def plan_prat_json(request: Request):
    """Alternative endpoint that accepts raw JSON for easier frontend integration."""
    try:
        data = await request.json()
        text = data.get('text')
        spatial_data = data.get('spatialData')
        user_id = data.get('userId', 'default_user')
        
        if not text:
            return {"error": "Missing text parameter"}, 400
        
        # Convert to request object and use the main endpoint handler
        request_obj = PlanPratRequest(query=text, user_id=user_id, spatial_data=spatial_data)
        return await plan_prat(request_obj)
    except Exception as e:
        logger.error(f"Error in plan_prat_json: {e}", exc_info=True)
        return {"error": "Internal server error"}, 500