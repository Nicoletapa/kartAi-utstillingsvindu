import logging
from typing import Dict, List, Any

from langchain_core.prompts import PromptTemplate

from src.core.agents.base import BaseAgent
from src.document_store import DocumentStore
from src.core.retrieval.spatial_retriever import SpatialDocumentRetriever
from src.core.retrieval.property_extractor import PropertyExtractor, PropertyIdentifiers
from src.data.application_types import get_application_types_by_keyword

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
    
    
    def _add_followup_suggestions(self, response_text:str, query:str) ->str:
        """Add follow-up suggestions to the response if appropriate""" 
        
        if len(response_text ) < 100:
            return response_text
        
        suggestion_prompt = PromptTemplate(
            template="""
            Based on this user query and your response, suggest 2-3 follow-up questiona the user might want to ask.
            
            User query: {query}
            
            Your response: {response} 
            
            Format your suggestions as a single paragraph starting with "Du kan også spørre meg om:" or similar phrase in Norwegian.
        Make the suggestions specific and directly related to the topic of the conversation.
        Keep it brief and natural sounding.
            """
        )
        
        try: 
            suggestion_result = self.llm.invoke(suggestion_prompt.format(query=query, response=response_text))
            if hasattr(suggestion_result, "content"):
                suggestions = suggestion_result.content
            else: 
                suggestions = str(suggestion_result)
                
            return f"{response_text}\n\n{suggestions}"
        except Exception as e:
            logger.error(f"Error generating follow-up suggestions: {e}")
            return response_text
        
    
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
            property_ids = self.property_extractor.extract_ids(query)
        
            
            context_response= self.document_store.query(query)

            context = context_response
            self._log_token_usage(context, "Building regulations context")
            
            
            guide_buttons = []
            if self._is_building_related(query):  
                guide_buttons = self._find_relevant_guides(query)
                
            
            if property_ids.gnr is not None or property_ids.bnr is not None:
                property_context = self._get_property_context(property_ids)
                if property_context:
                    context += f"\n\n{property_context}"
                    
            application_related = self._is_application_related(query)
            if application_related:
                relevant_keywords = self._extract_building_keywords(query)
                application_types = []
                for keyword in relevant_keywords:
                    application_types.extend(get_application_types_by_keyword(keyword))
                
                if application_types:
                    app_context = self._format_application_types(application_types)
                    context += f"\n\nRelevant application types:\n{app_context}"
                    
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
            self._log_token_usage(prompt.format(query=query, context=context), "Final prompt")
            
            chain = prompt | self.llm
            response = chain.invoke({"query": query, "context": context})
            if hasattr(response, "content"):
                response_text = response.content
            elif isinstance(response, dict) and "text" in response:
                response_text = response.get("text", "")
            else:
                response_text = str(response)
            response_text = self._add_followup_suggestions(response_text, query)
            
            logger.info(f"Generated response of length {len(response_text)}")
            
            return {
                "answer": response_text,
                "guides": guide_buttons
            }
            
        except Exception as e: 
            logger.error(f"Error processing query: {e}")
            return {
                "answer": "Beklager, det oppstod en feil under behandlingen av spørringen din.",
                "guides": []
            }
    
    def _is_building_related(self, query: str) -> bool:
        """Check if query is related to building regulations using LLM instead of keywords"""
        
        if len(query.split()) <= 2:
            quick_check_keywords = ["bygge", "garasje", "tilbygg", "søknad", "avstand"]
            query_lower = query.lower()
            if any(keyword in query_lower for keyword in quick_check_keywords):
                return True
        
        building_prompt = PromptTemplate(
            template="""
            Analyze the following user query and determine if it is related to building regulations, construction, 
            building permits, property development, or similar topics.
            
            User query: "{query}"
            
            Examples of building-related queries:
            - "Kan jeg bygge garasje på tomten min?"
            - "Hvor nær nabogrensen kan jeg sette opp en bod?"
            - "Trenger jeg byggetillatelse for å bygge veranda?"
            - "Regler for å bygge tilbygg til huset"
            - "Hva er maks høyde for en garasje?"
            
            Examples of non-building-related queries:
            - "Når åpner biblioteket?"
            - "Hvordan betaler jeg kommunale avgifter?"
            - "Hvem er ordføreren i kommunen?"
            - "Kan jeg få barnehageplass nå?"
            
            Respond with only "YES" if the query is about building regulations, construction, property development, 
            or related topics. Otherwise respond with "NO".
            """
        )
        
        try:
            response = self.llm.invoke(building_prompt.format(query=query))
            
            if hasattr(response, "content"):
                content = response.content.strip().upper()
            else:
                content = str(response).strip().upper()
            
            logger.debug(f"Building classification for '{query[:30]}...': {content}")
            
            return "YES" in content
            
        except Exception as e:
            logger.error(f"Error in building classification: {e}")
            
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
    
    def _is_application_related(self, query: str) -> bool:
        """Check if query is related to building application processes using LLM classification"""
        if len(query.split()) <= 3:
            application_keywords = [
                "søknad", "søke", "søknadspliktig", "byggesøknad", "byggetillatelse",
                "tillatelse", "unntatt søknadsplikt", "søknadsprosess", "ansvarlig søker"
            ]
            query_lower = query.lower()
            if any(keyword in query_lower for keyword in application_keywords):
                return True
        
        application_prompt = PromptTemplate(
            template="""
            Analyze if this query is about building permit applications, application processes, 
            documentation requirements, or anything related to permission/permitting processes 
            for construction.
            
            Examples of application-related queries:
            - "Hvordan søker jeg om å bygge garasje?"
            - "Trenger jeg å søke om tillatelse for et tilbygg?"
            - "Hvilken dokumentasjon trenger jeg for byggesøknaden?"
            - "Er garasjer under 50m² søknadspliktige?"
            - "Hva er forskjellen mellom søknadspliktig og ikke-søknadspliktig?"
            
            Examples of non-application-related queries:
            - "Hvor høy kan en garasje være?"
            - "Hva er minsteavstand til nabogrense?"
            - "Hvilke materialer kan jeg bruke i ytterveggen?"
            - "Kan jeg bygge på den tomten?"
            
            User query: "{query}"
            
            Is this query related to building permits or application processes? Answer YES or NO.
            """
        )
        
        try:
            response = self.llm.invoke(application_prompt.format(query=query))
            
            if hasattr(response, "content"):
                content = response.content.strip().upper()
            else:
                content = str(response).strip().upper()
            
            return "YES" in content
        except Exception as e:
            logger.error(f"Error in application classification: {e}")
            
            application_keywords = [
                "søknad", "søke", "søknadspliktig", "byggesøknad", "byggetillatelse",
                "tillatelse", "unntatt søknadsplikt", "søknadsprosess", "ansvarlig søker"
            ]
            
            query_lower = query.lower()
            return any(keyword in query_lower for keyword in application_keywords)
    
    def _extract_building_keywords(self, query: str) -> List[str]:
        """Extract relevant building keywords from the query using LLM analysis"""
        standard_keywords = [
            "garasje", "tilbygg", "påbygg", "enebolig", "hytte", "bod", 
            "uthus", "carport", "brygge", "terrasse", "veranda"
        ]
        
        query_lower = query.lower()
        if len(query.split()) <= 3:
            return [keyword for keyword in standard_keywords if keyword in query_lower]
        
        keyword_prompt = PromptTemplate(
            template="""
            Extract the specific building structure types mentioned in this query.
            
            Common structure types include:
            - garasje/carport
            - tilbygg/påbygg
            - enebolig
            - hytte/fritidsbolig
            - bod/uthus
            - terrasse/veranda/balkong
            - brygge
            - levegg/gjerde
            
            User query: "{query}"
            
            List only the specific structure types mentioned, one per line. Use Norwegian terms.
            If no specific structure is mentioned, respond with "none".
            """
        )
        
        try:
            response = self.llm.invoke(keyword_prompt.format(query=query))
            
            if hasattr(response, "content"):
                content = response.content.strip()
            else:
                content = str(response).strip()
            
            if content.lower() == "none":
                return []
            
            extracted_keywords = [kw.strip().lower() for kw in content.split('\n')]
            
            extracted_keywords = [kw for kw in extracted_keywords if kw]
            
            if not extracted_keywords:
                return [keyword for keyword in standard_keywords if keyword in query_lower]
                
            return extracted_keywords
            
        except Exception as e:
            logger.error(f"Error in keyword extraction: {e}")
            
            return [keyword for keyword in standard_keywords if keyword in query_lower]
    
    def _format_application_types(self, app_types: List) -> str:
        """Format application types into a readable context string"""
        context = []
        
        for app in app_types:
            app_info = [
                f"--- {app.name} ({app.id}) ---",
                f"Beskrivelse: {app.description}",
                "Krav:",
            ]
            
            for req in app.requirements:
                app_info.append(f"- {req}")
                
            app_info.append(f"Søknadsprosess: {app.application_process}")
            app_info.append("Nødvendig dokumentasjon:")
            
            for doc in app.documentation_needed:
                app_info.append(f"- {doc}")
                
            context.append("\n".join(app_info))
            
        return "\n\n".join(context)