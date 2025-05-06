import logging
import re
from typing import List, Dict, Any, Tuple, Optional

from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import ChatPromptTemplate 
from langchain_core.tools import BaseTool
from langchain.memory import ConversationBufferMemory
from langchain_core.exceptions import OutputParserException
from langchain_core.tools import Tool as LangchainCoreTool

from src.rag_tool import DocumentSearchTool
from src.search_internet_tool import SearchTool
from src.spatial_analysis_tool import SpatialAnalysisTool
from src.core.agents.base import BaseAgent
from src.generator import llm

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

def extract_markdown_links(text: str) -> Tuple[str, List[Dict[str, str]]]:
    """
    Extracts markdown links from text.
    Returns the text with the markdown links and their associated "Useful links:"
    or "Nyttige lenker:" header removed, and a list of guide objects.
    """
    guides = []
    # Pattern to find markdown links like [Title](URL)
    link_pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    
    # Find all links and store them
    matches = re.findall(link_pattern, text)
    for title, url in matches:
        guides.append({"title": title, "url": url})

    # Start with the original text for modification
    modified_text = text
    
    if guides:
        # If guides were found, remove all occurrences of the markdown link pattern
        modified_text = re.sub(link_pattern, '', modified_text)
        
        # Remove the "Useful links:" or "Nyttige lenker:" header line.
        # This regex looks for the header, possibly bolded, followed by optional whitespace and a newline.
        modified_text = re.sub(r"(\*\*Useful links:\*\*|\bUseful links:)\s*\n?", "", modified_text, flags=re.IGNORECASE)
        modified_text = re.sub(r"(\*\*Nyttige lenker:\*\*|\bNyttige lenker:)\s*\n?", "", modified_text, flags=re.IGNORECASE)
        
        # Clean up potentially multiple blank lines that might result from removals
        modified_text = re.sub(r'\n\s*\n', '\n', modified_text).strip()
        
    return modified_text, guides


class PlanAgent(BaseAgent):
    """Agent for handling planning and building regulation queries using tools."""

    # --- Constants ---
    RESET_COMMANDS = ["reset", "nullstill samtale", "start på nytt"]
    
    # Error Messages
    MSG_CONVERSATION_RESET = "Samtalen er nullstilt. Hva vil du snakke om nå?"
    MSG_DEFAULT_SYNC_ERROR = "Beklager, jeg kunne ikke fullføre behandlingen av spørsmålet ditt."
    MSG_DEFAULT_ASYNC_ERROR = "I encountered an issue while processing your question (async). Please try again or rephrase your query."
    MSG_PARSING_ERROR_FALLBACK_EMPTY_ANSWER = "Jeg fant relevant informasjon, men klarte ikke å formatere det endelige svaret riktig. Vennligst prøv igjen."
    MSG_PARSING_ERROR_FALLBACK_GENERIC = "Jeg støtte på et problem underveis i behandlingen av svaret. Vennligst prøv igjen."
    MSG_OUTPUT_PARSER_EXCEPTION = "Det oppstod en feil under formateringen av svaret. Prøv gjerne å omformulere spørsmålet."
    MSG_UNEXPECTED_ERROR = "Beklager, en uventet feil oppstod."

    name: str = "PlanAgent"
    tools: List[BaseTool]
    agent_executor: AgentExecutor
    memory: ConversationBufferMemory
    llm = llm

    doc_search_tool: Optional[DocumentSearchTool]
    search_tool: Optional[SearchTool]
    spatial_tool: Any 

    class ResetConversation(Exception):
        """Custom exception to signal a conversation reset."""
        pass

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key='output'
        )
        self._initialize_tools()
        if not self.tools:
            logger.critical("No tools were successfully initialized. Agent cannot function properly.")
            raise ValueError("Could not initialize any tools. Please check the logs for detailed errors.")
        self._initialize_agent_executor()
        logger.info("PlanAgent initialized.")

    def _initialize_tools(self):
        """Initializes and collects all tools for the agent."""
        self.tools = []
        try:
            self.doc_search_tool = DocumentSearchTool()
            self.tools.append(self.doc_search_tool)
            logger.info("DocumentSearchTool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize DocumentSearchTool: {e}", exc_info=True)
            self.doc_search_tool = None

        try:
            self.search_tool = SearchTool()
            self.tools.append(self.search_tool)
            logger.info("SearchTool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SearchTool: {e}", exc_info=True)
            self.search_tool = None

        try:
            self.spatial_tool = SpatialAnalysisTool()
            self.tools.append(self.spatial_tool)
            logger.info("SpatialAnalysisTool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SpatialAnalysisTool: {e}", exc_info=True)
            self.spatial_tool = LangchainCoreTool(
                name="spatial_analysis",
                func=lambda _: "Spatial analysis is currently unavailable. Please try again later.",
                description="Analyze spatial data (currently unavailable)"
            )
            self.tools.append(self.spatial_tool)
        
        self.tools = [tool for tool in self.tools if tool is not None]

    def _initialize_agent_executor(self):
        """Sets up the prompt, agent, and agent executor."""
        prompt_template_str = """
You are a helpful assistant for building regulations in Kristiansand municipality. Speak English. Be polite and clear.

**CORE RULE:** For all properties, base your answers ONLY on general municipal plan provisions and the guides available via the 'document_search' tool. DO NOT use or assume information from specific zoning plans.

**Goal:** Guide users on building rules and permits. Use 'document_search' for local rules (always general municipal plan provisions) and 'spatial_analysis' for map drawings.

**Available tools:**
{tools}

**TOOL USAGE AND RESPONSE FORMAT:**

Question: the user's question
Thought: Your reasoning and plan. Choose tools based on the following:
    - 'spatial_analysis': Use for map drawings. Analyze placement relative to boundaries, permitted areas, and whether permits (e.g., from a neighbor, road authority) are necessary based on distances/size. Everything MUST be assessed against general municipal plan provisions. The result must be included in 'Final Answer'.
    - 'document_search': Use for general local building rules (obtained from municipal plan provisions/related guides). Must NOT be used for specific zoning plans.
    - 'search_internet': Use for national guides (e.g., dibk.no), general info, or if 'document_search' does not provide answers to questions covered by general rules. Avoid searching for specific zoning plans.
    - Handling missing answers from 'document_search': If you do not find a specific answer in local documents, explain this. Refer to general information (e.g., from DiBK) if relevant, and ALWAYS recommend the user to contact Kristiansand municipality for final clarification.
Action: one of [{tool_names}]
Action Input: input for the action.
Observation: the result of the action.
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I have now attempted to find the information. Assess the result:
    - Found a clear answer based on general municipal plan provisions: I now have the information. Formulate the answer.
    - Did NOT find a specific local answer, but found general guidance (e.g., from DiBK): Base the answer on general guidance, and ALWAYS emphasize the need to check with the municipality. Formulate the answer.
    - Found no relevant information: Inform the user about this and ALWAYS recommend contacting the municipality. Formulate the answer.
Final Answer: Your answer to the user. The answer MUST contain:
    - Direct answer to the user's question, based on findings from tools (reflecting general municipal plan provisions).
    - If map data was used via 'spatial_analysis': Explain how the general rules apply to the drawing, including any permits.
    - If specific local information was not found: Explain this clearly. Refer to general information (if available), and ALWAYS recommend contacting Kristiansand municipality for final confirmation.
    - Source references (e.g., "According to the general municipal plan provisions...", "General guidance from DiBK suggests...").
    - A "Useful links:" section with Markdown links to official resources (`[Text](URL)`).
    - Optionally, 1-2 relevant follow-up questions.

**START!**

History: {chat_history}
User: {input}
Thought: {agent_scratchpad}
"""
        agent_prompt = ChatPromptTemplate.from_template(prompt_template_str)
        tool_descriptions = "\n".join(f"- {tool.name}: {tool.description}" for tool in self.tools)
        tool_names = ", ".join([tool.name for tool in self.tools])
        final_agent_prompt = agent_prompt.partial(tools=tool_descriptions, tool_names=tool_names)
        
        agent = create_react_agent(self.llm, self.tools, final_agent_prompt)
        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True, 
            max_iterations=6,
            memory=self.memory,
            return_intermediate_steps=True,
            early_stopping_method="force",
        )

    def _prepare_input(self, query: str, spatial_data: Optional[Dict[str, Any]] = None) -> None:
        if query.lower() in self.RESET_COMMANDS:
            self.reset_memory()
            raise self.ResetConversation()
        logger.info(f"Processing query: '{query[:50]}...' with spatial data: {spatial_data is not None}")
        if spatial_data and self.spatial_tool and \
           hasattr(self.spatial_tool, 'update_spatial_context') and \
           callable(self.spatial_tool.update_spatial_context):
            self.spatial_tool.update_spatial_context(spatial_data)
            drawing_type = spatial_data.get('shapeType', 'shape')
            logger.info(f"Spatial context updated with a {drawing_type} drawing.")

    def _handle_agent_parsing_error(self, agent_result: Dict[str, Any]) -> Optional[str]:
        """Attempts to recover a 'Final Answer' from intermediate steps if a parsing error occurred."""
        if "intermediate_steps" not in agent_result:
            logger.warning("Parsing error recovery: No intermediate steps found.")
            return None

        steps = agent_result["intermediate_steps"]
        if not steps:
            logger.warning("Parsing error recovery: Intermediate steps list is empty.")
            return None
        
        last_action_log = steps[-1][0].log
        if "Final Answer:" in last_action_log:
            try:
                final_answer_text = last_action_log.split("Final Answer:", 1)[1].strip()
                if final_answer_text:
                    logger.info("Successfully extracted Final Answer from last step after parsing error.")
                    return final_answer_text
                else:
                    logger.warning("Found 'Final Answer:' in logs, but the text after it was empty.")
                    return self.MSG_PARSING_ERROR_FALLBACK_EMPTY_ANSWER
            except Exception as extract_err:
                logger.error(f"Error extracting Final Answer from logs after parsing error: {extract_err}", exc_info=True)
                return self.MSG_PARSING_ERROR_FALLBACK_GENERIC
        else:
            logger.warning("Parsing error occurred, but 'Final Answer:' not found in the last LLM output log.")
            return self.MSG_PARSING_ERROR_FALLBACK_GENERIC

    def _process_agent_output(self, agent_result: Dict[str, Any], is_async: bool = False) -> Dict[str, Any]:
        answer = agent_result.get("output")

        if isinstance(answer, str) and "Could not parse LLM output:" in answer:
            logger.warning("Default parsing error detected, attempting custom recovery.")
            recovered_answer = self._handle_agent_parsing_error(agent_result)
            if recovered_answer:
                answer = recovered_answer
            else: 
                answer = self.MSG_PARSING_ERROR_FALLBACK_GENERIC


        if not isinstance(answer, str) or not answer.strip(): 
            default_message = self.MSG_DEFAULT_ASYNC_ERROR if is_async else self.MSG_DEFAULT_SYNC_ERROR
            logger.warning(f"Agent output was empty or not a string. Using default message: {default_message}")
            answer = default_message
            return {"answer": answer, "guides": []}

        answer_text, guides = extract_markdown_links(answer.strip())
        log_prefix = "(async)" if is_async else ""
        logger.info(f"Extracted {len(guides)} guides from answer {log_prefix}.")
        return {"answer": answer_text, "guides": guides}

    def _execute_agent_logic(self, query: str, is_async: bool) -> Dict[str, Any]:
        """Helper to encapsulate the agent invocation and common error handling."""
        try:
            if is_async:
                return self.agent_executor.ainvoke({"input": query})
            else:
                return self.agent_executor.invoke({"input": query})
        except OutputParserException as e:
            logger.error(f"OutputParserException during agent execution (is_async={is_async}): {e}", exc_info=True)
            
            return {"output": self.MSG_OUTPUT_PARSER_EXCEPTION} 
        except Exception as e:
            logger.error(f"Unexpected error during agent execution (is_async={is_async}): {e}", exc_info=True)
            return {"output": self.MSG_UNEXPECTED_ERROR} 

    def process(self, query: str, spatial_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        try:
            self._prepare_input(query, spatial_data)
        except self.ResetConversation:
            return {"answer": self.MSG_CONVERSATION_RESET, "guides": []}
        
        logger.info("Invoking agent executor (synchronously)...")
        agent_result = self._execute_agent_logic(query, is_async=False)
        return self._process_agent_output(agent_result, is_async=False)

    async def aprocess(self, query: str, spatial_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        try:
            self._prepare_input(query, spatial_data)
        except self.ResetConversation:
            return {"answer": self.MSG_CONVERSATION_RESET, "guides": []}

        logger.info("Invoking agent executor (asynchronously)...")
        agent_result = await self._execute_agent_logic(query, is_async=True) 
        return self._process_agent_output(agent_result, is_async=True)

    async def _execute_agent_logic_async(self, query: str) -> Dict[str, Any]:
        """Helper to encapsulate the async agent invocation and common error handling."""
        try:
            return await self.agent_executor.ainvoke({"input": query})
        except OutputParserException as e:
            logger.error(f"OutputParserException during async agent execution: {e}", exc_info=True)
            return {"output": self.MSG_OUTPUT_PARSER_EXCEPTION}
        except Exception as e:
            logger.error(f"Unexpected error during async agent execution: {e}", exc_info=True)
            return {"output": self.MSG_UNEXPECTED_ERROR}

    async def aprocess(self, query: str, spatial_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        try:
            self._prepare_input(query, spatial_data)
        except self.ResetConversation:
            return {"answer": self.MSG_CONVERSATION_RESET, "guides": []}

        logger.info("Invoking agent executor (asynchronously)...")
        agent_result = await self._execute_agent_logic_async(query)
        return self._process_agent_output(agent_result, is_async=True)
        
    def _execute_agent_logic_sync(self, query: str) -> Dict[str, Any]:
        """Helper to encapsulate the sync agent invocation and common error handling."""
        try:
            return self.agent_executor.invoke({"input": query})
        except OutputParserException as e:
            logger.error(f"OutputParserException during sync agent execution: {e}", exc_info=True)
            return {"output": self.MSG_OUTPUT_PARSER_EXCEPTION}
        except Exception as e:
            logger.error(f"Unexpected error during sync agent execution: {e}", exc_info=True)
            return {"output": self.MSG_UNEXPECTED_ERROR}

    def process(self, query: str, spatial_data: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        try:
            self._prepare_input(query, spatial_data)
        except self.ResetConversation:
            return {"answer": self.MSG_CONVERSATION_RESET, "guides": []}
        
        logger.info("Invoking agent executor (synchronously)...")
        agent_result = self._execute_agent_logic_sync(query)
        return self._process_agent_output(agent_result, is_async=False)

    def reset_memory(self):
        if self.memory:
            self.memory.clear()
        logger.info("Conversation memory reset.")

