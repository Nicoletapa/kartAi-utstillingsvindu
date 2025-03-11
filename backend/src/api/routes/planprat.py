from fastapi import APIRouter, HTTPException, status, Depends
import logging

from src.models.types import PlanPratRequest, PlanPratResponse, ApplicationFormResponse
from src.core.agents.plan_agent import PlanAgent
from src.services.agent_factory import get_plan_agent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plan-prat", tags=["planning"])

# Initialize agent
plan_agent = PlanAgent()

@router.post("", response_model=PlanPratResponse)
async def plan_prat(question: PlanPratRequest) -> PlanPratResponse:
    """Handle plan chat queries."""
    if not question.query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Query is empty"
        )

    # Get user ID for form state tracking
    user_id = question.user_id if hasattr(question, "user_id") else "default_user"
    
    # Get the plan agent instance
    agent = get_plan_agent()
    
    # Process the query with the agent
    response = agent.process(question.query, user_id=user_id)
    
    # Check if this is a form response
    if isinstance(response, dict) and "form_state" in response:
        # Special handling for form responses
        form_state = response.pop("form_state")
        answer = response.get("answer", "")
        guides = response.get("guides", [])
        
        # Add form-specific data
        return ApplicationFormResponse(
            answer=answer,
            guides=guides,
            form_state=form_state,
            current_section=response.get("current_section", ""),
            form_summary=response.get("form_summary", "")
        )
    
    # Standard response handling
    if isinstance(response, dict) and "answer" in response:
        return PlanPratResponse(answer=response["answer"], guides=response.get("guides", []))
    else:
        return PlanPratResponse(answer=response)