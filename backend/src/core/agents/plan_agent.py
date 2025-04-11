import logging 
from typing_extensions import Dict, Any
from langchain_core.prompts import PromptTemplate
from src.core.agents.base import BaseAgent
from src.document_store import DocumentStore
from src.core.retrieval.spatial_retriever import SpatialDocumentRetriever
from src.core.retrieval.property_extractor import PropertyExtractor


logger = logging.getLogger(__name__)

class PlanAgent(BaseAgent):
    """Agent for handling planning and building regulation queries"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.document_store = DocumentStore()
        self.property_extractor = PropertyExtractor(llm=self.llm)
        self.spatial_retriever = SpatialDocumentRetriever()
    
    def _is_greeting(self, query: str) -> bool:
        """
        Detect if the query is a simple greeting message using LLM classification.
        For very short messages, still use pattern matching for efficiency.
        """
        query_lower = query.lower().strip().rstrip("!.,?")
        
       
        if len(query_lower.split()) <= 2:
            greeting_patterns = [
                "hei", "hello", "hallo", "hi", "hey", "god dag", "god morgen", 
                "god kveld", "morn", "halla", "heisann", "hva skjer", "hvordan går det"
            ]
            if any(pattern in query_lower for pattern in greeting_patterns):
                return True
        
        if len(query_lower.split()) <= 5:
            greeting_prompt = PromptTemplate(
                template="""
                Analyze whether this message is ONLY a greeting or contains a substantive question.
                
                Examples of just greetings:
                - "Hei"
                - "God morgen"
                - "Hallo, hvordan går det?"
                - "Hei, er du der?"
                
                Examples of substantive questions:
                - "Hei, kan jeg bygge en garasje?"
                - "God dag, jeg lurer på regler for tilbygg"
                - "Hallo, trenger jeg byggetillatelse?"
                
                User message: "{query}"
                
                Is this ONLY a greeting without a substantive question? Answer YES or NO.
                """
            )
            
            try:
                response = self.llm.invoke(greeting_prompt.format(query=query))
                
                if hasattr(response, "content"):
                    content = response.content.strip().upper()
                else:
                    content = str(response).strip().upper()
                
                return "YES" in content
            except Exception as e:
                logger.error(f"Error in greeting classification: {e}")
                return len(query_lower.split()) <= 3
        
        return False
    
    def _handle_greeting(self, query:str) -> Dict[str, Any]:
        """Generate a naturla, conversational respose to greetings"""

        greeting_prompt = PromptTemplate(
        template="""
        Instructions for the AI assistant:
        - You are a friendly assistant for Kristiansand municipality's building department.
        - Write a SHORT, casual greeting response in Norwegian.
        - Say hello back in a friendly way.
        - Briefly ask how you can help with questions about building permits or regulations.
        - Suggest 1-2 common topics people ask about (like building garages or distance requirements).
        - Keep your response to just 2-3 short sentences.
        - Be warm but professional.
        - DON'T include detailed information about building laws or regulations.
        - DON'T mention map coordinates or specific locations.
        
        User message: {query}
        """
    )
        
        try:
            response =self.llm.invoke(greeting_prompt.format(query=query))
            
            if hasattr(response, "content"):
                response_text = response.content
            else:
                response_text = str(response)
                
            return {
                "answer" : response_text,
                "guides" : []
            }
        except Exception as e :
            logger.error(f"Error generating greeting response: {e}")
            return {
                "answer": "Hei! Hvordan kan jeg hjelpe deg i dag?",
                "guides": []
            }
    
   
    def process(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Process a planning regulations query
        
        Args:
            query: The user query string
            
        Returns:
            Dict containing answer and guide buttons
        """
        
        logger.info(f"Processing query: {query[:50]}...")
        
        if self._is_greeting(query):
            logger.info("Detected greeting, generating conversational response")
            return self._handle_greeting(query)
        
        try:
            # Using only existing methods and adding placeholder for future implementation
            context = "This is placeholder context until React Agent is implemented."
                
            prompt = PromptTemplate(
            template="""
Instructions for the AI assistant:
- You are a senior municipality worker with deep expertise in building permits and regulations.
- Answer the user's question using the context provided.
- Your answers MUST be DEFINITIVE and DIRECT.
- When the user asks if they can build something, give a clear YES or NO answer whenever possible.
- Provide SPECIFIC measurements, distances, and requirements whenever applicable.
- Use CONCRETE examples to illustrate your points.
- Avoid hedging language like "it might be", "perhaps", "it depends", unless absolutely necessary.
- When regulations have exceptions, clearly state both the rule AND the specific exceptions.
- If the user's question doesn't provide enough details for a definitive answer, ask 1-2 specific follow-up questions.
- Answer in the same language as the user's question.
- Don't include URLs directly in your response - they will be provided as clickable buttons.
- The context below is not seen by the user, only you.

User query: {query}

Context (not visible to user):
{context}
"""
            )
                
            chain = prompt | self.llm
            response = chain.invoke({"query": query, "context": context})
            
            if hasattr(response, "content"):
                response_text = response.content
            elif isinstance(response, dict) and "text" in response:
                response_text = response.get("text", "")
            else:
                response_text = str(response)
                
            return {
                "answer": response_text,
                "guides": []
            }
                
        except Exception as e: 
            logger.error(f"Error processing query: {e}")
            return {
                "answer": "Beklager, det oppstod en feil under behandlingen av spørringen din.",
                "guides": []
            }
