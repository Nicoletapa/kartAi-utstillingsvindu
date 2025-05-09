import logging
from src.core.agents.plan_agent import PlanAgent

logger = logging.getLogger(__name__)

# --- Plan Agent Singleton ---
_plan_agent_instance = None

def get_plan_agent():
    """
    Get or create a singleton instance of PlanAgent.
    This ensures we only create one instance across requests.
    
    Returns:
        PlanAgent: The singleton PlanAgent instance
    """
    global _plan_agent_instance
    if _plan_agent_instance is None:
        logger.info("Creating new PlanAgent instance")
        _plan_agent_instance = PlanAgent()
    return _plan_agent_instance