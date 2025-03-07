from fastapi import APIRouter, HTTPException, status
import logging

from src.models.types import PlanPratRequest, PlanPratResponse
from src.core.agents.plan_agent import PlanAgent

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize agent
plan_agent = PlanAgent()

@router.post("/plan-prat", response_model=PlanPratResponse)
async def process_planprat_query(request: PlanPratRequest) -> PlanPratResponse:
    """
    Process a planning regulations query
    
    Args:
        request: Request containing the user query
        
    Returns:
        Response with answer and guide buttons
    """
    query = request.query
    logger.info(f"Processing PlanPrat query: {query}")
    
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query is empty"
        )
    
    try:
        result = plan_agent.process(query)
        
        return PlanPratResponse(
            answer=result["answer"],
            guides=result.get("guides", [])
        )
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process query"
        )