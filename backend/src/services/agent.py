import logging

from typing_extensions import TypedDict
import time
from langchain_core.prompts import PromptTemplate

from langgraph.graph import StateGraph

from langchain_core.prompts import PromptTemplate
import tiktoken 
from typing import List
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, START, END

from src.services.agent_parts.generator import llm
from src.services.agent_parts.crag import (
    decide_to_generate,
    generate,
    grade_documents,
    retrieve,
    transform_query,
    web_search,
)

# Add import for AreaPlanRetriever
from src.services.document_services.areaplan_retriever import AreaPlanRetriever

from backend.src.types import PropertyIdentifiers


logger = logging.getLogger(__name__)

# Initialize the AreaPlanRetriever
area_plan_retriever = AreaPlanRetriever()


class RetrievalState(TypedDict):
    """
    Represents the state of our retrieval graph using CRAG.

    Attributes:
        question: question
        answer: LLMs answer based on the question and context
        web_search: whether to add search
        documents: list of documents
    """

    question: str
    generation: str
    web_search: str
    documents: list[str]


class AgentState(TypedDict):
    retrieval_state: RetrievalState

def count_tokens(text):
    """Count tokens in text using tiktoken"""
    encoder = tiktoken.get_encoding("cl100k_base")
    tokens = encoder.encode(text)
    return len(tokens)

def _retrieve_law_context(query: str = "") -> str:
    """
    Retrieve compact, relevant law context based on the query
    """
    # Extract key topic from query
    query_lower = query.lower()
    
    # Define compact topic-based contexts
    contexts = {
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
    
    
    # Find most relevant context
    if "garasje" in query_lower or "uthus" in query_lower or "bod" in query_lower or "50" in query_lower:
        return contexts["garasje"]
    elif "tilbygg" in query_lower or "påbygg" in query_lower or "utvid" in query_lower:
        return contexts["tilbygg"]
    elif "avstand" in query_lower or "nabo" in query_lower or "grense" in query_lower:
        return contexts["avstand"]
    elif "høyde" in query_lower or "etasje" in query_lower or "tak" in query_lower:
        return contexts["høyde"]
    elif "universell" in query_lower or "tilgjengelig" in query_lower or "rullestol" in query_lower:
        return contexts["universell"]
    else:
        # Default to general context
        return contexts["general"]


def invoke_plan_agent(query: str) -> dict:
    """
    Invoke the plan agent.

    Args:
        query (str): The query to the plan agent.
    Returns:
        dict: The response from the plan agent containing answer and guides.
    """
    # Extract property identifiers from the query
    property_ids = extract_property_ids_from_query(query)
    
    # Initialize context with general law information
    context = _retrieve_law_context(query)
    guide_buttons = []
    
    # Check if the query is about building something or regulations
    building_related = is_building_related_query(query)
    
    # If related to building, search for relevant guides
    if building_related:
        logger.info("Query related to building construction, searching for guides")
        
        # Create specific targeted searches for DIBK and Kristiansand kommune
        dibk_query = f"site:dibk.no byggveileder byggesøknad {query}"
        kristiansand_query = f"site:kristiansand.kommune.no byggesak {query}"
        
        try:
            from src.services.agent_parts.crag import web_search_tool
            guide_context = "Relevante veivisere og nettsider:\n\n"
            
            # Search DIBK guides
            logger.info(f"Searching DIBK guides with query: {dibk_query}")
            dibk_results = web_search_tool.invoke({"query": dibk_query})
            time.sleep(1)
            
            # Search Kristiansand kommune guides
            logger.info(f"Searching Kristiansand guides with query: {kristiansand_query}")
            kristiansand_results = web_search_tool.invoke({"query": kristiansand_query})
            
            # Process DIBK results
            if dibk_results:
                for result in dibk_results[:2]:  
                    if isinstance(result, dict) and 'url' in result:
                        title = result.get("title", "Byggveileder fra DIBK")
                        url = result.get("url", "")
                        content = result.get("content", "Ingen beskrivelse")
                        
                        # Only add if URL is from DIBK
                        if "dibk.no" in url.lower():
                            guide_context += f"- {title}\n  URL: {url}\n  Beskrivelse: {content}\n\n"
                            guide_buttons.append({
                                "title": f"DIBK: {title}",
                                "url": url,
                                "description": content[:100] + "..." if len(content) > 100 else content
                            })
                            logger.info(f"Added DIBK guide: {title}")
            
            # Process Kristiansand kommune results
            if kristiansand_results:
                for result in kristiansand_results[:2]:  
                    if isinstance(result, dict) and 'url' in result:
                        title = result.get("title", "Veiledning fra Kristiansand kommune")
                        url = result.get("url", "")
                        content = result.get("content", "Ingen beskrivelse")
                        
                        # Only add if URL is from Kristiansand kommune
                        if "kristiansand.kommune.no" in url.lower():
                            guide_context += f"- {title}\n  URL: {url}\n  Beskrivelse: {content}\n\n"
                            guide_buttons.append({
                                "title": f"Kristiansand: {title}",
                                "url": url,
                                "description": content[:100] + "..." if len(content) > 100 else content
                            })
                            logger.info(f"Added Kristiansand guide: {title}")
            
            if guide_buttons:
                context += "\n\n" + guide_context
                logger.info(f"Added {len(guide_buttons)} guide search results to context")
            
        except Exception as e:
            logger.error(f"Error searching for building guides: {e}")
    
    # If property identifiers were found, retrieve relevant area plans
    if property_ids and (property_ids.gnr is not None or property_ids.bnr is not None):
        logger.info(f"Found property identifiers: gnr={property_ids.gnr}, bnr={property_ids.bnr}, snr={property_ids.snr}")
        
        # Retrieve documents for the property
        area_plans = area_plan_retriever.get_area_plans_for_property(property_ids)
        
        # Format the documents as context
        if area_plans:
            property_context = area_plan_retriever.format_documents_as_context(area_plans)
            context += "\n\nSpecific area plans for the property:\n" + property_context
            logger.info(f"Added {len(area_plans)} area plans to context")

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
    # logger.info(f"Using context with {'building guides and ' if building_related else ''}{'property-specific information' if property_ids and (property_ids.gnr is not None or property_ids.bnr is not None) else 'general information'}")
    final_token_count = count_tokens(context)
    logger.info(f"Final context token count: {final_token_count}")
    
    # Generate response
    generate = prompt | llm
    response = generate.invoke({"query": query, "context": context})
    logger.info(f"Response: {response}")
    return { 
        "answer": response.content,
        "guides": guide_buttons
    }
    


def is_building_related_query(query: str) -> bool:
    """
    Determine if a query is related to building construction or regulations.
    """
    # Simple keyword matching for building-related terms
    building_keywords = [
        "bygge", "bygging", "byggeregler", "garasje", "tilbygg", "påbygg", 
        "hus", "bolig", "enebolig", "rekkehus", "hytte", "bod", "uthus",
        "søknad", "søknadspliktig", "tillatelse", "regulering",
        "avstand", "nabogrense", "høyde", "etasje", "areal"
    ]
    
    query_lower = query.lower()
    
    for keyword in building_keywords:
        if keyword in query_lower:
            return True
            
    return False


def extract_property_ids_from_query(query: str) -> PropertyIdentifiers:
    """
    Extract property identifiers (gnr, bnr, snr) from a query string.
    
    Args:
        query (str): The query text to extract property identifiers from.
    Returns:
        PropertyIdentifiers: The extracted property identifiers.
    """
    # Define regex patterns for property identifiers
    gnr_pattern = r'(?:g(?:år)?d?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?)(\d+)'
    bnr_pattern = r'(?:b(?:ruk)?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?)(\d+)'
    snr_pattern = r'(?:s(?:eksjon)?s?n(?:umme)?r\.?(?:\s+)?(?:nr\.?)?(?:\s+)?)(\d+)'
    
    # Alternative pattern for combined format like "1/2/3"
    combined_pattern = r'(\d+)\/(\d+)(?:\/(?:0\/)?(\d+))?'
    
    # Initialize property identifiers
    gnr = None
    bnr = None
    snr = None
    
    # Try to extract using individual patterns
    import re
    gnr_match = re.search(gnr_pattern, query, re.IGNORECASE)
    if gnr_match:
        gnr = int(gnr_match.group(1))
    
    bnr_match = re.search(bnr_pattern, query, re.IGNORECASE)
    if bnr_match:
        bnr = int(bnr_match.group(1))
    
    snr_match = re.search(snr_pattern, query, re.IGNORECASE)
    if snr_match:
        snr = int(snr_match.group(1))
    
    # If individual patterns didn't work, try combined pattern
    if gnr is None and bnr is None:
        combined_match = re.search(combined_pattern, query)
        if combined_match:
            gnr = int(combined_match.group(1))
            bnr = int(combined_match.group(2))
            if combined_match.group(3):
                snr = int(combined_match.group(3))
    
    # If we still don't have property IDs, try using LLM to extract them
    if gnr is None and bnr is None:
        prompt = PromptTemplate(
            template="""
            Extract property identifiers (gnr, bnr, snr) from the following text if present:
            
            {query}
            
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
        
        try:
            llm_response = llm.predict(prompt.format(query=query))
            import json
            ids = json.loads(llm_response)
            gnr = ids.get("gnr")
            bnr = ids.get("bnr")
            snr = ids.get("snr")
        except Exception as e:
            logger.error(f"Error extracting property IDs with LLM: {e}")
    
    return PropertyIdentifiers(gnr=gnr, bnr=bnr, snr=snr)



    


def create_graph() -> StateGraph:
    # Initialize the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("grade_documents", grade_documents)
    workflow.add_node("generate", generate)
    workflow.add_node("transform_query", transform_query)
    workflow.add_node("web_search_node", web_search)

    # Build edges
    workflow.add_edge(START, "retrieve")
    workflow.add_edge("retrieve", "grade_documents")
    workflow.add_conditional_edges(
        "grade_documents",
        decide_to_generate,
        {
            "transform_query": "transform_query",
            "generate": "generate",
        },
    )
    workflow.add_edge("transform_query", "web_search_node")
    workflow.add_edge("web_search_node", "generate")

    # Compile the graph
    app = workflow.compile()
    return app
