import re
import json
import logging
from dataclasses import dataclass
from typing import Optional

from langchain.prompts import PromptTemplate
from langchain_core.language_models import BaseLLM

logger = logging.getLogger(__name__)

@dataclass
class PropertyIdentifiers:
    gnr: Optional[int] = None
    bnr: Optional[int] = None
    snr: Optional[int] = None

class PropertyExtractor:
    """Extracts property identifiers from text"""
    
    def __init__(self, llm: Optional[BaseLLM] = None):
        self.llm = llm
    
    def extract_ids(self, text: str) -> PropertyIdentifiers:
        """
        Extract property identifiers (gnr, bnr, snr) from text
        
        Args:
            text: The text to extract property identifiers from
        
        Returns:
            PropertyIdentifiers object
        """
        # First try with regex patterns
        ids = self._extract_with_regex(text)
        
      
        if self.llm and ids.gnr is None and ids.bnr is None:
            text_lower = text.lower()
            # Only use LLM if the text likely contains property identifiers
            if any(term in text_lower for term in ["eiendom", "gård", "gnr", "bnr", "bruk", "/", "tomt"]):
                try:
                    llm_ids = self._extract_with_llm(text)
                    # Only use LLM results if they contain actual values
                    if llm_ids.gnr is not None or llm_ids.bnr is not None:
                        ids = llm_ids
                except Exception as e:
                    logger.error(f"Error extracting property IDs with LLM: {e}")
        
        return ids
    
    def _extract_with_regex(self, text: str) -> PropertyIdentifiers:
        """Extract property IDs using regex patterns"""
        # Define regex patterns
        gnr_pattern = r'(?:g(?:år)?d?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?)(\d+)'
        bnr_pattern = r'(?:b(?:ruk)?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?)(\d+)'
        snr_pattern = r'(?:s(?:eksjon)?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?)(\d+)'
        combined_pattern = r'(\d+)\/(\d+)(?:\/(?:0\/)?(\d+))?'
        
        # Initialize property identifiers
        gnr = None
        bnr = None
        snr = None
        
        # Extract using individual patterns
        gnr_match = re.search(gnr_pattern, text, re.IGNORECASE)
        if gnr_match:
            gnr = int(gnr_match.group(1))
        
        bnr_match = re.search(bnr_pattern, text, re.IGNORECASE)
        if bnr_match:
            bnr = int(bnr_match.group(1))
        
        snr_match = re.search(snr_pattern, text, re.IGNORECASE)
        if snr_match:
            snr = int(snr_match.group(1))
        
        # If individual patterns didn't work, try combined pattern
        if gnr is None and bnr is None:
            combined_match = re.search(combined_pattern, text)
            if combined_match:
                gnr = int(combined_match.group(1))
                bnr = int(combined_match.group(2))
                if combined_match.group(3):
                    snr = int(combined_match.group(3))
        
        return PropertyIdentifiers(gnr=gnr, bnr=bnr, snr=snr)
    
    def _extract_with_llm(self, text: str) -> PropertyIdentifiers:
        """Extract property IDs using LLM"""
        prompt = PromptTemplate(
            template="""
            Extract property identifiers (gnr, bnr, snr) from the following text if present:
            
            {text}
            
            In Norway, a property's unique designation in the land register is known as the gårds- og bruksnummer (gnr/bnr), identifying a farm (gårdsnummer) and a subdivided unit (bruksnummer).
            These might appear in formats like:
            - "gnr. 1, bnr. 2" 
            - "gårdsnummer 1, bruksnummer 2"
            - "1/2" (gnr/bnr)
            - "1/2/3" (gnr/bnr/snr)
            
            If you find these identifiers, return them in this exact JSON format:
            {"gnr": number, "bnr": number, "snr": number}
            
            If any identifier is not present, set its value to null.
            If no identifiers are found, return:
            {"gnr": null, "bnr": null, "snr": null}
            """
        )
        
        llm_response = self.llm.predict(prompt.format(text=text))
        ids = json.loads(llm_response)
        
        return PropertyIdentifiers(
            gnr=ids.get("gnr"),
            bnr=ids.get("bnr"),
            snr=ids.get("snr")
        )