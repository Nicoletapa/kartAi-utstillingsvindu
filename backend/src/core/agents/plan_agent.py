import logging
import re
from typing import List, Dict, Any, Optional

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
        self.doc_search_tool: Optional[DocumentSearchTool] = None
        self.search_tool: Optional[SearchTool] = None
        self.spatial_tool: Any = None 

        try:
            tool_instance = DocumentSearchTool()
            self.doc_search_tool = tool_instance
            self.tools.append(tool_instance)
            logger.info("DocumentSearchTool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize DocumentSearchTool: {e}", exc_info=True)

        try:
            tool_instance = SearchTool()
            self.search_tool = tool_instance
            self.tools.append(tool_instance)
            logger.info("SearchTool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SearchTool: {e}", exc_info=True)
            

        try:
            tool_instance = SpatialAnalysisTool()
            self.spatial_tool = tool_instance
            self.tools.append(tool_instance)
            logger.info("SpatialAnalysisTool initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize SpatialAnalysisTool: {e}", exc_info=True)
            fallback_spatial_tool = LangchainCoreTool(
                name="spatial_analysis", # Must match the name used in prompts
                func=lambda _: ("Spatial analysis tool is currently unavailable due to an internal error. "
                                "Please inform the user and try to answer without it if possible, "
                                "or suggest they try again later."),
                description=("Analyzes spatial data like coordinates and drawings from a map. "
                            "Use this to determine distances, check against boundaries, etc. "
                            "Currently unavailable if initialization failed.")
            )
            self.spatial_tool = fallback_spatial_tool 
            self.tools.append(fallback_spatial_tool)

     
        if not self.tools:
            logger.critical("No tools were successfully initialized or have fallbacks. Agent may not function properly.")
        elif not any(tool.name == "document_search" for tool in self.tools): 
            logger.warning("Critical tool 'document_search' is not available. Functionality will be limited.")


    def _initialize_agent_executor(self):
        """Sets up the prompt, agent, and agent executor."""
        prompt_template_str = """
You are a helpful assistant specializing in building regulations for Kristiansand municipality. Your primary function is to guide users on general building rules and permit requirements. Always be polite, clear, and respond in the same language as the user's question.

**CORE MISSION AND DIRECTIVES:**
1.  **Strict Adherence to General Plans:** Your answers concerning properties MUST ONLY be based on **general municipal plan provisions** and official guides for these provisions, accessible via the 'document_search' tool and verified/supplemented by official online sources via 'search_internet'.
2.  **NO SPECIFIC ZONING PLANS:** You MUST NOT use, reference, or infer information from specific zoning plans (e.g., "reguleringsplaner"). If a user's query seems to require this level of detail, you must state that you can only provide guidance based on general municipal plan provisions and recommend they contact the municipality for specifics related to zoning plans.
3.  **Accuracy and Sourcing:** Clearly state the source of your information. Prioritize citing official, publicly accessible URLs from Kristiansand municipality or relevant Norwegian national bodies (e.g., DiBK) for any general municipal plan provisions or guidance mentioned. If an internal document is the primary source of the text, also reference it.
4.  **Guidance, Not Approval:** Emphasize that your advice is for guidance based on general rules and final confirmation/permits must be obtained from Kristiansand municipality.

5.  **Prioritize Credible Online Sources:**
    * When answering, your primary goal is to cite **credible, official internet sources** (e.g., Kristiansand kommune website, dibk.no, lovdata.no) for the general municipal plan provisions and related guidance.
    * Even if 'document_search' provides information, you should **actively attempt to find and use a corresponding official public URL** for that information using 'search_internet'. This is for transparency and to provide the user with the most current, verifiable source.
    * If there's a discrepancy, state what was found internally and what was found externally, and if the external source is official and more recent, prefer it for the primary answer while noting the information. If internal documents are the sole source for a specific detail of the *general plan*, state this.

**Available tools:**
{tools}

**TOOL USAGE STRATEGY AND REASONING PROTOCOL (ReAct Framework):**

Question: The user's question.
Thought:
    1.  Analyze the user's question: What specific information are they seeking? Does it involve spatial aspects (requiring a map drawing) or purely regulatory information? What language is the user using?
    2.  Recall **CORE MISSION AND DIRECTIVES**: My answer must be based on **general municipal plan provisions**. I must avoid specific zoning plans. I need to prioritize finding and citing official online sources.
    3.  Plan tool usage:
        * For questions about local building rules, regulations, or requirements from the **general municipal plan provisions**:
            a.  First, use 'document_search' to locate relevant sections of the general municipal plan provisions or associated internal guides.
            b.  Then, **critically**, use 'search_internet' to find the corresponding official, publicly accessible version of these provisions or guidance from Kristiansand municipality's official website or other official Norwegian government sources (like DiBK). The goal is to obtain a citable URL and verify the information is current.
        * If the question involves understanding the placement of a structure, distances to boundaries, or requires visual assessment on a map: Use 'spatial_analysis'. The output of 'spatial_analysis' (e.g., distances, coordinates) MUST then be interpreted strictly against the **general municipal plan provisions** (found via 'document_search' and then verified/sourced online via 'search_internet', or known general rules).
        * If 'document_search' (and subsequent 'search_internet' verification) does not yield answers covered by **general municipal plan provisions**, or for general national-level building guides (e.g., from dibk.no) or general information not specific to Kristiansand's general plan: Use 'search_internet'. Explicitly avoid using 'search_internet' to find specific zoning plans for Kristiansand.
    4.  If I need to use multiple tools, I will plan the sequence. For example, use 'spatial_analysis' to get measurements, then 'document_search' to find relevant general rules, then 'search_internet' to find the official online source for those rules.
Action: One of [{tool_names}]
Action Input: The input for the selected tool.
Observation: The result from the tool.
... (Repeat Thought/Action/Action Input/Observation as needed. After each Observation, reassess if the **general municipal plan provisions** are being correctly applied and if an **official online source** has been identified. If I have enough information after an Observation, I will proceed to the final Thought and Final Answer below.)

Thought: I have now gathered all necessary information (or determined that I cannot find more relevant information using the tools) and will construct the final response. I will assess the results against my **CORE MISSION AND DIRECTIVES**, especially regarding sourcing from official online resources for general provisions:
    * **Scenario 1: Clear Answer Found (based on general municipal plan provisions, with online source):** I have found a direct answer within the general municipal plan provisions AND have located an official online source for it. I will formulate the response based on this, prioritizing the online source for citation.

    * **Scenario 2: Clear Answer Found (based on general municipal plan provisions, internal source only):** I have found a direct answer within the general municipal plan provisions via 'document_search' but could not locate a direct corresponding official online source despite trying 'search_internet'. I will state the information is from the internal general plan documents and mention that a public URL was not readily found.
    * **Scenario 3: No Specific Local Answer, but General National Guidance Available (with online source):** 'document_search' and 'search_internet' did not provide a specific local answer from Kristiansand's general municipal plan. However, I found relevant general guidance from an official national source (e.g., DiBK via 'search_internet'). I will base my answer on this general guidance, clearly state that specific local provisions were not found for this query, cite the national source, and STRONGLY emphasize the need to check with Kristiansand municipality.
    * **Scenario 4: No Relevant Information Found:** Neither local general provisions nor general national guidance seems to directly address the query. I will inform the user about this lack of specific information and ALWAYS recommend contacting Kristiansand municipality.
My complete response to the user, covering all aspects of the "FINAL ANSWER CONSTRUCTION" section, MUST now be provided. This response MUST start with the exact phrase "Final Answer:".
Final Answer: (Construct the answer according to the "FINAL ANSWER CONSTRUCTION" section below. Ensure your entire response, including all parts like references and follow-up questions, is part of this 'Final Answer:' block and is prefixed by "Final Answer:". The language of this final answer must match the user's input language.)

FINAL ANSWER CONSTRUCTION:
Your final answer to the user MUST include the following components, in a clear and organized manner:
1.  **Direct Response:** A clear answer to the user's question, explicitly stating that it is based on **general municipal plan provisions** (or general national guidance if local general provisions are not found).
2.  **Spatial Analysis Explanation (if 'spatial_analysis' was used):**
    * Describe the relevant findings from the map analysis (e.g., distances, location relative to boundaries).
    * Crucially, explain how the **general municipal plan provisions** (ideally citing an official online source found via 'search_internet', or from 'document_search' if no online source was found) apply to these spatial findings.
    * Indicate if any permits or consents appear necessary based on these general rules and spatial analysis.

3.  **Transparency about Information Source & Limitations:**
    * Clearly state if information is from an official online source (and provide the URL), from internal documents ('document_search'), or general national guidance.
    * If specific information from local **general municipal plan provisions** was sought but not found (neither online nor internally), clearly state this.
    * If relying on general national guidance (e.g., DiBK), mention this and its general nature.

4.  **Source References & Citations:** Integrate references directly into your explanation where appropriate (e.g., "The general municipal plan provisions, as stated on [Official Kristiansand URL], specify that X...", or "According to DiBK's guide on Z [URL]..."). 
5.  **Recommendation for Official Confirmation:** ALWAYS include a polite closing statement recommending the user to contact Kristiansand municipality for final clarification, verification, and to discuss specific zoning plans if relevant to their property.
6.  **Useful Links:** A section titled "Useful links:" (or "Nyttige lenker:" if responding in Norwegian). Provide 1-3 Markdown formatted links to **official resources**. Format the links as follows:
    * [Link Description](URL)
    
7.  **Follow-up Questions (Optional):** 1-2 relevant, open-ended follow-up questions to further assist the user, if appropriate.

**Language Note:** While your final response to the user must be in the language of their question (e.g., Norwegian for a Norwegian question), your internal "Thought" process can remain in English if it's more effective for your reasoning, as long as the "Final Answer" is correctly translated and natural-sounding in the user's language.

**BEGIN!**

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
            streaming=True
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
        log_prefix = "(async)" if is_async else ""

        if isinstance(answer, str) and "Could not parse LLM output:" in answer:
            logger.warning(f"{log_prefix} Default parsing error detected, attempting custom recovery.")
            recovered_answer = self._handle_agent_parsing_error(agent_result)
            if recovered_answer:
                answer = recovered_answer
            else: 
                answer = self.MSG_PARSING_ERROR_FALLBACK_GENERIC

        if not isinstance(answer, str) or not answer.strip(): 
            default_message = self.MSG_DEFAULT_ASYNC_ERROR if is_async else self.MSG_DEFAULT_SYNC_ERROR
            logger.warning(f"{log_prefix} Agent output was empty or not a string. Using default message: {default_message}")
            answer = default_message
            return {"answer": answer, "guides": [], "original_header": None}

       
        logger.info(f"{log_prefix} Passing raw agent output to frontend.")
        return {"answer": answer.strip(), "guides": [], "original_header": None}

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

