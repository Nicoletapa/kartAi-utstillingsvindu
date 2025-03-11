from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any


class PlanPratRequest(BaseModel):
    query: str
    user_id: Optional[str] = None

class GuideButton(BaseModel):
    title: str
    url: str
    description: Optional[str] = None
    
class PlanPratResponse(BaseModel):
    answer: str
    guides: List[GuideButton] = []

class PropertyIdentifiers(BaseModel):
    gnr: Optional[int] = None
    bnr: Optional[int] = None
    snr: Optional[int] = None

class ApplicationFormResponse(PlanPratResponse):
    form_state: str
    current_section: Optional[str] = None
    form_summary: Optional[str] = None



