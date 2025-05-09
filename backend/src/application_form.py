"""
Application form structure and helper functions for guiding users through the application process.
"""

from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class ApplicationType(BaseModel):
    name: str
    size_limit: Optional[str] = None
    note: Optional[str] = None
    restriction: Optional[str] = None
    condition: Optional[str] = None
    description: Optional[str] = None

class PropertyDetails(BaseModel):
    address: str = ""
    gårdsnr: str = ""
    bruksnr: str = ""
    postnr_sted: str = ""
    kommune: str = ""
    festenr: str = ""
    seksjonsnr: str = ""

class ApplicantDetails(BaseModel):
    name: str = ""
    phone: str = ""
    email: str = ""
    mobile: str = ""
    alternative_address: str = ""

class EnvironmentalConflicts(BaseModel):
    near_tram_train_tracks: str = ""
    near_water_sewer_pipes: str = ""
    near_high_voltage_lines: str = ""
    near_coast_river: str = ""
    in_flood_risk_area: str = ""
    protected_species_present: str = ""
    cultural_heritage_site: str = ""

class Distances(BaseModel):
    neighbor_boundary: str = ""
    road_center: str = ""
    nearest_building: str = ""

class AccessChanges(BaseModel):
    new_driveway: str = ""
    road_type: str = ""

class ConstructionSize(BaseModel):
    calculation_methods: List[str] = []
    selected_method: Optional[str] = None
    value: Optional[str] = None

class Attachments(BaseModel):
    plans_and_drawings: List[str] = []
    neighbor_notification: List[str] = []
    dispensation_requests: List[str] = []
    other_attachments: str = ""

class Signature(BaseModel):
    date: str = ""
    applicant_signature: str = ""

class ApplicationForm(BaseModel):
    """Complete application form structure"""
    application_types: List[ApplicationType] = []
    selected_application_type: Optional[str] = None
    permissions: List[str] = []
    selected_permission: Optional[str] = None
    requirements: Dict[str, str] = {}
    property_details: PropertyDetails = Field(default_factory=PropertyDetails)
    applicant_details: ApplicantDetails = Field(default_factory=ApplicantDetails)
    municipal_plans: List[str] = []
    selected_municipal_plan: Optional[str] = None
    construction_size: ConstructionSize = Field(default_factory=ConstructionSize)
    distances: Distances = Field(default_factory=Distances)
    environmental_conflicts: EnvironmentalConflicts = Field(default_factory=EnvironmentalConflicts)
    access_changes: AccessChanges = Field(default_factory=AccessChanges)
    attachments: Attachments = Field(default_factory=Attachments)
    signature: Signature = Field(default_factory=Signature)

# Pre-defined application form template based on the provided JSON
APPLICATION_FORM_TEMPLATE = ApplicationForm(
    application_types=[
        ApplicationType(
            name="Bygge tilbygg",
            size_limit="mindre enn 50 m2",
            note="OBS: ikke påbygg"
        ),
        ApplicationType(
            name="Rive et tilbygg",
            size_limit="mindre enn 50 m2"
        ),
        ApplicationType(
            name="Bygge frittliggende bygning",
            size_limit="mindre enn 70 m2",
            restriction="ingen skal bo eller overnatte"
        ),
        ApplicationType(
            name="Rive frittliggende bygning",
            size_limit="mindre enn 70 m2",
            restriction="ikke godkjent som bolig eller til overnatting"
        ),
        ApplicationType(
            name="Annet",
            condition="kun etter avtale med kommunen",
            description="Beskriv med egne ord hva du skal gjøre"
        )
    ],
    permissions=[
        "Ja, dispensasjon er vedlagt",
        "Ja, tillatelse/vedtak er vedlagt",
        "Nei, jeg trenger ikke"
    ],
    requirements={
        "situational_map": "Bestill et situasjonskart over eiendommen din fra kommunen"
    },
    municipal_plans=[
        "Kommuneplan",
        "Reguleringsplan",
        "Andre planer"
    ],
    construction_size=ConstructionSize(
        calculation_methods=[
            "BYA - Bebygd areal i m2",
            "BRA - Bruksareal i m2",
            "T-BRA - Tillatt bruksareal i m2",
            "%BYA - Bebygd areal i %",
            "%BRA - Bruksareal i %",
            "%TU - Tillatt utnyttelsesgrad i %",
            "U-grad (denne betegnelsen brukes i enkelte eldre planer)"
        ]
    ),
    attachments=Attachments(
        plans_and_drawings=[
            "Plantegning før og etter",
            "Snittegning før og etter",
            "Fasadetegninger av alle fasader før og etter",
            "Situasjonskart med markeringer",
            "Beregningsmåte for grad av utnytting"
        ],
        neighbor_notification=[
            "Komplett nabovarsel med vedlegg",
            "Dokumentasjon på varsling",
            "Eventuelle merknader fra naboer"
        ],
        dispensation_requests=[
            "Søknader om dispensasjon",
            "Uttalelser/vedtak fra annen myndighet",
            "Dine kommentarer til naboens merknader"
        ]
    )
)

class FormFillingState(BaseModel):
    """Tracks the current state of the form filling process"""
    active: bool = False
    current_section: str = ""
    completed_sections: List[str] = []
    form_data: ApplicationForm = Field(default_factory=lambda: ApplicationForm(**APPLICATION_FORM_TEMPLATE.model_dump()))
    
    def get_next_question(self) -> str:
        """Get the next question to ask based on the current section"""
        # All possible sections in order
        sections = [
            "application_type",
            "permissions",
            "property_details",
            "applicant_details",
            "construction_size",
            "distances",
            "environmental_conflicts",
            "attachments"
        ]
        
        # If no current section, start with first
        if not self.current_section:
            return sections[0]
        
        # Find current section index
        try:
            current_index = sections.index(self.current_section)
            # Return the next section if available
            if current_index < len(sections) - 1:
                return sections[current_index + 1]
        except ValueError:
            # Current section not found in the list
            return sections[0]
            
        # If we're at the last section
        return "review"
    
    def update_section(self, section: str, data: Dict[str, Any]) -> None:
        """Update a specific section of the form with new data"""
        form_dict = self.form_data.model_dump()
        
        if section in form_dict:
            if isinstance(form_dict[section], dict):
                form_dict[section].update(data)
            else:
                form_dict[section] = data
                
            self.form_data = ApplicationForm(**form_dict)
            
            if section not in self.completed_sections:
                self.completed_sections.append(section)
    
    def get_section_summary(self, section: str) -> str:
        """Get a human-readable summary of the data in a section"""
        form_data = self.form_data.model_dump()
        
        if section not in form_data:
            return "Ingen informasjon tilgjengelig for denne seksjonen."
        
        data = form_data[section]
        
        if section == "application_type":
            return f"Type søknad: {self.form_data.selected_application_type}"
        elif section == "property_details":
            pd = self.form_data.property_details
            return f"Eiendomsinfo: {pd.address}, Gnr/Bnr: {pd.gårdsnr}/{pd.bruksnr}, Kommune: {pd.kommune}"
        elif section == "applicant_details":
            ad = self.form_data.applicant_details
            return f"Søker: {ad.name}, Kontakt: {ad.email}, {ad.phone}"
        
        # Generic handling for other sections
        if isinstance(data, dict):
            return ", ".join([f"{k}: {v}" for k, v in data.items() if v])
        elif isinstance(data, list):
            return ", ".join(data)
        else:
            return str(data)
    
    def get_complete_form_summary(self) -> str:
        """Get a complete summary of the form data"""
        summaries = []
        
        for section in self.completed_sections:
            summary = self.get_section_summary(section)
            summaries.append(f"{section}: {summary}")
        
        return "\n".join(summaries)
    
    def is_section_complete(self, section: str) -> bool:
        """Check if a section has enough information to be considered complete"""
        if section in self.completed_sections:
            return True
            
        form_dict = self.form_data.model_dump()
        
        if section == "application_type":
            return self.form_data.selected_application_type is not None
        elif section == "property_details":
            pd = self.form_data.property_details
            # Consider complete if we have at least address or gnr/bnr
            return bool((pd.address and pd.kommune) or (pd.gårdsnr and pd.bruksnr))
        elif section == "applicant_details":
            ad = self.form_data.applicant_details
            # Need at least name and a contact method
            return bool(ad.name and (ad.phone or ad.email or ad.mobile))
            
        # Default - section is incomplete
        return False

def get_form_questions(section: str) -> Dict[str, str]:
    """Get the questions to ask for a specific form section"""
    questions = {
        "application_type": "Hvilken type søknad ønsker du å fylle ut? (Velg et nummer)\n" + 
                           "\n".join([f"{i+1}. {app.name} {f'({app.size_limit})' if app.size_limit else ''}" 
                                     for i, app in enumerate(APPLICATION_FORM_TEMPLATE.application_types)]),
                                     
        "permissions": "Trenger du dispensasjon eller tillatelse? (Velg et nummer)\n" +
                       "\n".join([f"{i+1}. {p}" for i, p in enumerate(APPLICATION_FORM_TEMPLATE.permissions)]),
                       
        "property_details": "La oss fylle ut informasjon om eiendommen. Kan du oppgi:\n" +
                           "1. Adresse\n2. Gårdsnummer\n3. Bruksnummer\n4. Postnummer og sted\n5. Kommune",
                           
        "applicant_details": "Nå trenger vi informasjon om deg som søker:\n" +
                            "1. Fullt navn\n2. Telefonnummer\n3. E-postadresse",
                            
        "construction_size": "Hvilken beregningsmetode ønsker du å bruke for størrelsen på byggverket? (Velg et nummer)\n" +
                            "\n".join([f"{i+1}. {m}" for i, m in enumerate(APPLICATION_FORM_TEMPLATE.construction_size.calculation_methods)]),
                            
        "distances": "Kan du angi følgende avstander i meter:\n" +
                    "1. Avstand til nabogrense\n2. Avstand til midten av vei\n3. Avstand til nærmeste bygning",
                    
        "environmental_conflicts": "Finnes det miljømessige konflikter? Svar ja eller nei på følgende:\n" +
                                 "1. Er byggverket nær trikk/togspor?\n2. Er det vann/kloakkrør i nærheten?\n" +
                                 "3. Er det høyspentlinjer i nærheten?\n4. Er byggverket nær kyst/elv?\n" +
                                 "5. Er området i en flomsone?",
                                 
        "attachments": "Hvilke vedlegg vil du inkludere i søknaden? (Skriv numrene separert med komma)\n" +
                      "Tegninger:\n" + "\n".join([f"{i+1}. {a}" for i, a in enumerate(APPLICATION_FORM_TEMPLATE.attachments.plans_and_drawings)])
    }
    
    return {section: questions.get(section, "Ingen spørsmål for denne seksjonen.")}
