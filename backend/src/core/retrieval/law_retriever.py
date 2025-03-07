import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

class LawContextRetriever:
    """Retrieves relevant law context based on query"""
    
    def __init__(self):
        # Define compact topic-based contexts
        self.contexts = {
        "general": """
        BYGGFORSKRIFTER - HOVEDPUNKTER:
        - Plan- og bygningsloven og TEK17 stiller minimumskrav til byggverk
        - Krav til sikkerhet, helse, miljø og energi
        - Reguleringsplan bestemmer hva som kan bygges hvor
        - Kommunen gir byggetillatelser og fører tilsyn
        """,
        
        "garasje": """
        GARASJE/UTHUS - REGLER:
        - Under 50 m²: Kan være unntatt søknadsplikt hvis:
          * Minst 1m fra nabogrense eller nabosamtykke
          * Maks 4m mønehøyde/3m gesimshøyde nær nabogrense
        - Avstandskrav: 4m fra nabogrense (generelt)
        - Må følge reguleringsplan og utnyttelsesgrad
        """,
        
        "tilbygg": """
        TILBYGG/PÅBYGG - REGLER:
        - Under 15 m²: Kan være unntatt søknadsplikt
        - Over 15 m²: Krever søknad og ansvarsrett
        - Påbygg (vertikalt): Alltid søknadspliktig
        - Må følge avstandskrav og reguleringsplan
        """,
        
        "avstand": """
        AVSTANDSKRAV - REGLER:
        - 4m fra nabogrense (hovedregel)
        - 8m mellom bygninger (brannkrav)
        - Unntak med nabosamtykke
        - Små byggverk (<50m²): 1m fra grense mulig
        """,
        
        "høyde": """
        HØYDEBEGRENSNINGER:
        - Fastsettes i reguleringsplan
        - Generelt: Mønehøyde maks 9m, gesimshøyde maks 8m for småhus
        - Mindre bygg nær nabogrense: Maks 4m mønehøyde/3m gesimshøyde
        """,
        
        "universell": """
        UNIVERSELL UTFORMING:
        - Tilgjengelig boenhet påkrevd i de fleste nye boliger
        - Krav til snusirkel (1,5m) i bad/toalett/entre
        - Trinnfri adkomst til alle hovedfunksjoner
        - Unntak for enkelte småhus og fritidsboliger
        """
    }
    
    def get_context(self, query: str = "") -> str:
        """
        Retrieve only relevant law context based on query keywords
        
        Args:
            query: The user's query
            
        Returns:
            String with relevant law context
        """
        if not query:
            return self.contexts["general"]
        
        query_lower = query.lower()
        
        # Find most relevant context
        if "garasje" in query_lower or "uthus" in query_lower or "bod" in query_lower:
            return self.contexts["garasje"]
        elif "tilbygg" in query_lower or "påbygg" in query_lower or "utvid" in query_lower:
            return self.contexts["tilbygg"]
        elif "avstand" in query_lower or "nabo" in query_lower or "grense" in query_lower:
            return self.contexts["avstand"]
        elif "høyde" in query_lower or "etasje" in query_lower or "tak" in query_lower:
            return self.contexts["høyde"]
        else:
            # Default to general context
            return self.contexts["general"]