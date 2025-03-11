from src.core.agents.plan_agent import PlanAgent

# Singleton instance of PlanAgent
_plan_agent_instance = None

def get_plan_agent() -> PlanAgent:
    """Get (or create) the singleton instance of PlanAgent"""
    global _plan_agent_instance
    if _plan_agent_instance is None:
        _plan_agent_instance = PlanAgent()
    return _plan_agent_instance
