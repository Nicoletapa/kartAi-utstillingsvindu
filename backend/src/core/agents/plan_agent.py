import logging
import time
from typing import Dict, List, Any, Optional, Tuple

from langchain_core.prompts import PromptTemplate

from src.core.agents.base import BaseAgent
from src.core.retrieval.law_retriever import LawContextRetriever
from src.core.retrieval.spatial_retriever import SpatialDocumentRetriever
from src.core.extractors.property_extractor import PropertyExtractor, PropertyIdentifiers
from src.data.application_types import get_application_types_by_keyword, get_all_application_types
# Import the new application form module
from src.data.application_form import FormFillingState, get_form_questions

logger = logging.getLogger(__name__)

class PlanAgent(BaseAgent):
    """Agent for handling planning and building regulation queries"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.law_retriever = LawContextRetriever()
        self.property_extractor = PropertyExtractor(llm=self.llm)
        self.spatial_retriever = SpatialDocumentRetriever()
        # Add form handling state
        self.form_states = {}  # Dictionary to store form states by user ID
    
    def _is_greeting(self, query:str) -> bool:
        """Detect if the query is a simple greeting message"""
        greeting_patterns = [
           "hei", "hello", "hallo", "hi", "hey", "god dag", "god morgen", 
        "god kveld", "morn", "halla", "heisann", "hva skjer", "hvordan går det"
        ]
        
        query_lower = query.lower().strip().rstrip("!.,?")
        
        if len(query_lower.split()) <=3:
            return any(greeting in query_lower for greeting in greeting_patterns)
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
        start_time = time.time()
        logger.info(f"Processing query: {query[:50]}...")
        
        # Check for form-related intent
        user_id = kwargs.get("user_id", "default_user")
        form_state = self.form_states.get(user_id)
        
        # Check if this is a form-filling related query
        if self._is_form_related(query) or (form_state and form_state.active):
            return self._handle_application_form(query, user_id)
        
        if self._is_greeting(query):
            logger.info("Detected greeting, generating conversational response")
            return self._handle_greeting(query)
        
        try:
            # Extract property identifiers
            property_ids = self.property_extractor.extract_ids(query)
        
            # Get relevant law context
            context = self.law_retriever.get_context(query)
            self._log_token_usage(context, "Law context")
            
            
            guide_buttons = []
            if self._is_building_related(query):  
                guide_buttons = self._find_relevant_guides(query)
                
            
            if property_ids.gnr is not None or property_ids.bnr is not None:
                property_context = self._get_property_context(property_ids)
                if property_context:
                    context += f"\n\n{property_context}"
                    
            # Check if query is related to application types
            application_related = self._is_application_related(query)
            if application_related:
                # Find relevant application types
                relevant_keywords = self._extract_building_keywords(query)
                application_types = []
                for keyword in relevant_keywords:
                    application_types.extend(get_application_types_by_keyword(keyword))
                
                # Add application type information to context
                if application_types:
                    app_context = self._format_application_types(application_types)
                    context += f"\n\nRelevant application types:\n{app_context}"
                    
            prompt = PromptTemplate(
            template="""
    Instructions for the AI assistant:
    - You are a senior municipality worker specializing in building permits.
    - Answer the user's question using the context provided.
    - Explain regulations in simple, easy-to-understand language.
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
            
            # Fix: Use response_text length instead of response object
            logger.info(f"Generated response of length {len(response_text)}")
            
            return {
                "answer": response_text,
                "guides": guide_buttons
            }
            
        except Exception as e:  # Fix: properly indented except block
            logger.error(f"Error processing query: {e}")
            return {
                "answer": "Beklager, det oppstod en feil under behandlingen av spørringen din.",
                "guides": []
            }
    
    def _is_form_related(self, query: str) -> bool:
        """Check if query is related to filling out an application form using LLM"""
        
        # For very short queries, use a quick check first to avoid unnecessary LLM calls
        if len(query.split()) <= 3:
            return False
            
        intent_prompt = PromptTemplate(
            template="""
            Analyze the following user query and determine if it is related to filling out an application form or application process.
            
            User query: "{query}"
            
            Examples of form-related queries:
            - "Jeg trenger hjelp med å fylle ut byggesøknaden"
            - "Hvordan søker jeg om byggetillatelse?"
            - "Kan du hjelpe meg med skjemaet for garasje?"
            - "Jeg vil starte en søknadsprosess for tilbygg"
            
            Examples of non-form-related queries:
            - "Hva er reglene for å bygge garasje?"
            - "Hvor langt fra tomtegrensen må jeg bygge?"
            - "Hei, hvordan går det?"
            - "Hvilke dokumenter trenger jeg for byggetillatelse?"
            
            Respond with only "YES" if the query is about filling out forms or starting an application process, otherwise respond with "NO".
            """
        )
        
        try:
            # Use LLM to classify the intent
            response = self.llm.invoke(intent_prompt.format(query=query))
            
            # Extract response content
            if hasattr(response, "content"):
                content = response.content.strip().upper()
            else:
                content = str(response).strip().upper()
                
            # Check if the response indicates a form-related query
            return "YES" in content
            
        except Exception as e:
            logger.error(f"Error in form intent classification: {e}")
            
            # Fall back to keyword matching if LLM fails
            form_keywords = [
                "fyll ut søknad", "søknadsskjema", "fylle ut skjema", "hjelp med søknad", 
                "søknadsprosess", "registrere søknad", "starte søknad", "begynne søknad"
            ]
            
            query_lower = query.lower()
            return any(keyword in query_lower for keyword in form_keywords)
    
    def _handle_application_form(self, query: str, user_id: str) -> Dict[str, Any]:
        """Handle application form filling process with context awareness"""
        # Initialize form state if doesn't exist
        if user_id not in self.form_states:
            self.form_states[user_id] = FormFillingState()
            
        form_state = self.form_states[user_id]
        
        # Special case for "reset" command
        if query.strip().lower() in ["start over", "reset", "restart", "begynn på nytt"]:
            self.form_states[user_id] = FormFillingState()
            form_state = self.form_states[user_id]
            form_state.active = True
            form_state.current_section = "application_type"
            questions = get_form_questions("application_type")
            return {
                "answer": f"Ok, la oss starte på nytt!\n\n{questions['application_type']}",
                "guides": [],
                "form_state": "active",
                "current_section": "application_type"
            }
        
        # Check if this is the initial form request
        if not form_state.active:
            form_state.active = True
            form_state.current_section = "application_type"
            
            # Extract any form data that might already be in the initial query
            prefilled_data = self._extract_form_data_from_query(query)
            logger.info(f"Extracted data from initial query: {prefilled_data}")
            
            # Pre-fill data if available and update current section
            intro_message = "Jeg kan hjelpe deg med å fylle ut søknaden! "
            
            if "application_type" in prefilled_data:
                app_type_data = prefilled_data["application_type"]
                if "selected_application_type" in app_type_data:
                    selected_type = app_type_data["selected_application_type"]
                    description = app_type_data.get("description", "")
                    
                    # Update form state
                    form_state.update_section("application_type", app_type_data)
                    
                    # Customize message
                    intro_message += f"Jeg forstår at du ønsker å {selected_type.lower()}"
                    if description:
                        intro_message += f" ({description}). "
                    else:
                        intro_message += ". "
                        
                    # Move directly to the next section
                    next_section = form_state.get_next_question()
                    form_state.current_section = next_section
                    questions = get_form_questions(next_section)
                    
                    return {
                        "answer": f"{intro_message}\n\nLa oss fortsette med neste steg:\n\n{questions[next_section]}",
                        "guides": [],
                        "form_state": "active",
                        "current_section": next_section
                    }
            
            # If no application type was detected, ask for it
            questions = get_form_questions("application_type")
            return {
                "answer": f"{intro_message}\n\n{questions['application_type']}",
                "guides": [],
                "form_state": "active",
                "current_section": "application_type"
            }
        
        # Handle form exit commands
        if query.strip().lower() in ["cancel", "exit", "quit", "avbryt", "avslutt"]:
            form_state.active = False
            return {
                "answer": "Jeg har avbrutt utfyllingen av søknaden. Du kan starte på nytt når du vil.",
                "guides": [],
                "form_state": "cancelled"
            }
        
        # Process answer to the current section's question and get next section
        processed_answer = self._process_form_section_answer(query, form_state)
        
        # Get the next section AFTER processing the current answer
        next_section = form_state.get_next_question()
        logger.info(f"Moving from section '{form_state.current_section}' to '{next_section}'")
        
        # If we're done with the form
        if next_section == "review":
            summary = form_state.get_complete_form_summary()
            form_state.active = False
            
            return {
                "answer": f"Takk! Du har fullført søknadsskjemaet. Her er en oppsummering av informasjonen:\n\n{summary}\n\nDu kan nå sende inn søknaden, eller si fra hvis du vil endre noe.",
                "guides": [],
                "form_state": "complete",
                "form_summary": summary
            }
        
        # Otherwise, move to the next section
        form_state.current_section = next_section
        questions = get_form_questions(next_section)
        
        return {
            "answer": f"{processed_answer}\n\n{questions[next_section]}",
            "guides": [],
            "form_state": "in_progress",
            "current_section": next_section
        }

    def _extract_form_data_from_query(self, query: str) -> Dict[str, Any]:
        """Extract form data from initial query using LLM"""
        
        extraction_prompt = PromptTemplate(
            template="""
            Analyze the user's query about a building project to identify what type of application they need.
            
            User query: "{query}"
            
            Available application types:
            1. "Bygge tilbygg" (mindre enn 50 m2) - For building extensions under 50m²
            2. "Rive et tilbygg" (mindre enn 50 m2) - For demolishing extensions under 50m²
            3. "Bygge frittliggende bygning" (mindre enn 70 m2) - For building detached structures under 70m²
            4. "Rive frittliggende bygning" (mindre enn 70 m2) - For demolishing detached structures under 70m²
            5. "Annet" - For other types of applications
            
            First, determine if the user is asking about filling out an application.
            If yes, return a JSON object with:
            1. The most appropriate application type name (exact match from the list above)
            2. Any details mentioned (like size, purpose, location)
            
            Example:
            For query "Kan jeg bygge en garasje på 45m²", return:
            {{
              "application_type": {{
                "selected_application_type": "Bygge frittliggende bygning",
                "description": "garasje på 45m²"
              }},
              "property_details": {{
                /* any property details if mentioned */
              }}
            }}
            
            If the user isn't asking about filling out an application, return empty JSON: {{}}
            """
        )
        
        try:
            # Extract using LLM
            response = self.llm.invoke(extraction_prompt.format(query=query))
            
            # Process content
            if hasattr(response, "content"):
                content = response.content
            else:
                content = str(response)
                
            # Extract JSON data
            import json
            import re
            
            # Find JSON pattern
            json_match = re.search(r'(\{[\s\S]*\})', content)
            if json_match:
                json_str = json_match.group(1)
                extracted_data = json.loads(json_str)
                logger.info(f"Extracted application data: {extracted_data}")
                return extracted_data
                    
        except Exception as e:
            logger.error(f"Error extracting form data from query: {e}")
            
        # Return empty dict if extraction fails
        return {}

    def _process_form_section_answer(self, answer: str, form_state: FormFillingState) -> str:
        """Process user's answer for a form section and update the form"""
        current_section = form_state.current_section
        
        # Check for skip command
        if answer.strip().lower() in ["skip", "hopp over", "neste"]:
            return "Hopper over denne delen."
        
        # Add more debugging to track the flow
        logger.info(f"Processing answer for section: {current_section}")
        
        # Use LLM to extract structured data from the user's response
        extraction_prompt = PromptTemplate(
            template="""
            Given the user's response to a question about {section} in a building application form,
            extract the relevant information in JSON format.
            
            Section: {section}
            Question: {question}
            User response: {answer}
            
            Extract only the factual information related to the section. Return as valid JSON.
            """
        )
        
        questions = get_form_questions(current_section)
        question = questions.get(current_section, "")
        
        try:
            # Extract structured data using LLM
            extraction_response = self.llm.invoke(
                extraction_prompt.format(
                    section=current_section,
                    question=question,
                    answer=answer
                )
            )
            
            import json
            import re
            
            # Try to extract JSON content
            if hasattr(extraction_response, "content"):
                content = extraction_response.content
            else:
                content = str(extraction_response)
                
            # Find JSON pattern
            json_match = re.search(r'(\{[\s\S]*\})', content)
            if json_match:
                json_str = json_match.group(1)
                extracted_data = json.loads(json_str)
                
                # Update the form state with extracted data
                form_state.update_section(current_section, extracted_data)
                logger.info(f"Successfully updated section {current_section} with data: {extracted_data}")
                
                return f"Takk! Jeg har registrert dine svar for {current_section}."
            else:
                logger.warning(f"Could not extract JSON from LLM response for section {current_section}")
                return "Jeg forstår ikke helt svaret ditt. La oss gå videre, og du kan endre dette senere hvis nødvendig."
                
        except Exception as e:
            logger.error(f"Error processing form answer: {e}")
            return "Jeg hadde litt problemer med å tolke svaret ditt, men la oss fortsette. Du kan endre informasjonen senere."
    
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
    
    def _is_application_related(self, query: str) -> bool:
        """Check if query is related to building application processes"""
        application_keywords = [
            "søknad", "søke", "søknadspliktig", "byggesøknad", "byggetillatelse",
            "tillatelse", "unntatt søknadsplikt", "søknadsprosess", "ansvarlig søker"
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in application_keywords)
    
    def _extract_building_keywords(self, query: str) -> List[str]:
        """Extract relevant building keywords from the query"""
        building_keywords = [
            "garasje", "tilbygg", "påbygg", "enebolig", "hytte", "bod", 
            "uthus", "carport", "brygge", "terrasse", "veranda"
        ]
        
        query_lower = query.lower()
        return [keyword for keyword in building_keywords if keyword in query_lower]
    
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