import logging
import time
from typing import Dict, List, Any

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain

from src.core.agents.base import BaseAgent
from src.core.retrieval.law_retriever import LawContextRetriever
from src.core.retrieval.spatial_retriever import SpatialDocumentRetriever
from src.core.extractors.property_extractor import PropertyExtractor, PropertyIdentifiers
from src.utils.token_counter import count_tokens

logger = logging.getLogger(__name__)

class PlanAgent(BaseAgent):
    """Agent for handling planning and building regulation queries"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.law_retriever = LawContextRetriever()
        self.property_extractor = PropertyExtractor(llm=self.llm)
        self.spatial_retriever = SpatialDocumentRetriever()
     
     
        
    def process(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Process a planning regulations query
        
        Args:
            query: The user query string
            
        Returns:
            Dict containing answer and guide buttons
        """
        # Extract property identifiers
        property_ids = self.property_extractor.extract_ids(query)
        
        # Get relevant law context
        context = self.law_retriever.get_context(query)
        self._log_token_usage(context, "Law context")
        
        # Check if building-related query for guide retrieval
        guide_buttons = []
        if self._is_building_related(query):
            guide_buttons = self._find_relevant_guides(query)
            
        # Add property-specific information if available
        if property_ids.gnr is not None or property_ids.bnr is not None:
            property_context = self._get_property_context(property_ids)
            if property_context:
                context += f"\n\n{property_context}"
                
        # Generate response
        prompt = PromptTemplate(
            template="""
            You are a senior municipality worker specializing in the regulation of building permits. A citizen has come to you with a question. Write a response to the citizen's question:
            Query: {query}

            Use the following context of the laws and regulations in your response:
            {context}
            Remember that the user does not have the same level of expertise as you do, so make sure to explain the laws and regulations in a way that is easy to understand.
            Also know that the context is not seen by the user, only you.
            You shall answer the user's query in the same language as the user.
            
            If any building guides or resources were found in the context, mention them but do not include the URLs directly in your response as they will be provided separately as clickable buttons to the user. Just refer to them like "I've provided links to relevant guides that can help you with this process."
            """
        )
        
        self._log_token_usage(prompt.format(query=query, context=context), "Final prompt")
        
        
        generate = LLMChain(llm=self.llm, prompt=prompt)
        response = generate.invoke({"query": query, "context": context})
        response_text = response.get("text", "")
        
        logger.info(f"Generated response of length {len(response)}")
        
        return {
            "answer": response_text,
            "guides": guide_buttons
        }
    
    
    
    
    def _is_building_related(self, query: str) -> bool:
        """Check if query is related to building regulations"""
        building_keywords = [
            "bygge", "bygging", "byggeregler", "garasje", "tilbygg", "påbygg", 
            "hus", "bolig", "enebolig", "rekkehus", "hytte", "bod", "uthus",
            "søknad", "søknadspliktig", "tillatelse", "regulering",
            "avstand", "nabogrense", "høyde", "etasje", "areal"
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in building_keywords)
    
    def _find_relevant_guides(self, query: str) -> List[Dict[str, str]]:
        """Find relevant building guides for the query"""
        # Implement web search functionality here
        # For now, return empty list as placeholder
        return []
    
    def _get_property_context(self, property_ids: PropertyIdentifiers) -> str:
        """Get context for a specific property"""
        # Here you would implement the retrieval of property-specific documents
        # For now, return a placeholder
        return f"Property information for gnr: {property_ids.gnr}, bnr: {property_ids.bnr}"