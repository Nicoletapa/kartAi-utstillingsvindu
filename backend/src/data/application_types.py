"""
Structured data about different building application types.
This module provides information that the chatbot can use to inform users
about different types of building applications and their requirements.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ExampleCase(BaseModel):
    """Example case for a specific application type"""
    description: str
    requires_application: bool
    notes: Optional[str] = None

class ApplicationType(BaseModel):
    """Represents a type of building application"""
    id: str
    name: str
    description: str
    requirements: List[str]
    application_process: str
    regulations: List[str]
    documentation_needed: List[str]
    example_cases: List[ExampleCase]

# Define the application types as structured data
APPLICATION_TYPES = [
    ApplicationType(
        id="simple_garage",
        name="Enkel garasje",
        description="Garasje under 50 m² som kan være unntatt søknadsplikt",
        requirements=[
            "Under 50 m² i grunnflate",
            "Minst 1m fra nabogrense eller samtykke fra nabo",
            "Maks 4m mønehøyde/3m gesimshøyde nær nabogrense"
        ],
        application_process="Kan være unntatt søknadsplikt hvis alle krav er oppfylt",
        regulations=["TEK17 §8-3", "Plan- og bygningsloven §20-5"],
        documentation_needed=[
            "Situasjonsplan",
            "Tegninger av bygget"
        ],
        example_cases=[
            ExampleCase(
                description="Frittstående garasje på 45m²",
                requires_application=False,
                notes="Forutsetter avstand til nabogrense > 1m"
            )
        ]
    ),
    ApplicationType(
        id="small_extension",
        name="Mindre tilbygg",
        description="Tilbygg under 15 m² som kan være unntatt søknadsplikt",
        requirements=[
            "Under 15 m² i grunnflate",
            "Minst 4m fra nabogrense",
            "Ikke bo- eller oppholdsrom"
        ],
        application_process="Kan være unntatt søknadsplikt hvis alle krav er oppfylt",
        regulations=["Plan- og bygningsloven §20-5", "SAK10 §4-1"],
        documentation_needed=[
            "Situasjonsplan",
            "Tegninger av tilbygget"
        ],
        example_cases=[
            ExampleCase(
                description="Vinterhage på 12m²",
                requires_application=False,
                notes="Forutsetter at det ikke gjøres til oppholdsrom"
            )
        ]
    ),
    ApplicationType(
        id="regular_house",
        name="Enebolig",
        description="Nybygg av enebolig som krever full byggesøknad",
        requirements=[
            "Ansvarlig søker må stå for søknaden",
            "Må følge reguleringsplan for området",
            "Må oppfylle tekniske krav i TEK17"
        ],
        application_process="Krever søknad om tillatelse med ansvarsrett",
        regulations=[
            "Plan- og bygningsloven §20-3",
            "TEK17 (alle relevante kapitler)",
            "SAK10 kapittel 5"
        ],
        documentation_needed=[
            "Søknadsskjema",
            "Situasjonsplan",
            "Tegninger (plan, snitt, fasade)",
            "Ansvarsrett for involverte foretak",
            "Nabovarsel"
        ],
        example_cases=[
            ExampleCase(
                description="Enebolig på 150m²",
                requires_application=True,
                notes="Krever full byggesøknad med ansvarlige foretak"
            )
        ]
    )
]

def get_application_type(application_id: str) -> Optional[ApplicationType]:
    """
    Get an application type by ID
    
    Args:
        application_id: The ID of the application type
        
    Returns:
        The application type if found, None otherwise
    """
    for app_type in APPLICATION_TYPES:
        if app_type.id == application_id:
            return app_type
    return None

def get_application_types_by_keyword(keyword: str) -> List[ApplicationType]:
    """
    Find application types containing a specific keyword
    
    Args:
        keyword: Keyword to search for in name or description
        
    Returns:
        List of matching application types
    """
    keyword = keyword.lower()
    return [
        app_type for app_type in APPLICATION_TYPES
        if keyword in app_type.name.lower() or keyword in app_type.description.lower()
    ]

def get_all_application_types() -> List[ApplicationType]:
    """Get all available application types"""
    return APPLICATION_TYPES

def to_dict() -> List[Dict[str, Any]]:
    """Convert all application types to a list of dictionaries"""
    return [app_type.model_dump() for app_type in APPLICATION_TYPES]
