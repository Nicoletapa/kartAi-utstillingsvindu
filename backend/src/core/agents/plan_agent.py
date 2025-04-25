import logging
from typing import List, Dict, Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_core.tools import BaseTool
from langchain.memory import ConversationBufferMemory
from langchain_core.exceptions import OutputParserException

from src.rag_tool import DocumentSearchTool
from src.search_internet_tool import SearchTool
from src.core.agents.base import BaseAgent
from src.generator import llm

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class PlanAgent(BaseAgent):
    """Agent for handling planning and building regulation queries using tools."""
    tools: List[BaseTool]
    agent_executor: AgentExecutor
    name: str = "PlanAgent"
    memory: ConversationBufferMemory
    llm = llm

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

        # --- Tool Initialization ---
        try:
            self.doc_search_tool = DocumentSearchTool()
            self.search_tool = SearchTool()
            self.tools = [self.doc_search_tool, self.search_tool]
        except Exception as e:
            logger.error(f"Failed to initialize tools: {e}", exc_info=True)
            raise ValueError("Could not initialize DocumentSearchTool or SearchTool.") from e

        # --- Agent Prompt Setup ---
        # Shorter prompt, encouraging external search for official links
        prompt = """
You are a helpful Kristiansand Municipality assistant for building regulations. Speak Norwegian. Be polite and clear.

**Goal:** Guide users by answering questions about building rules/permits using the provided tools. Assume the Kristiansand municipal plan (kommuneplanen) is the primary source for local rules. Also, provide links to relevant official resources on kristiansand.kommune.no or dibk.no when appropriate. Do NOT ask which plan applies.

**Available Tools:**
{tools}

**Use this format ONLY when using tools:**
Question: the user's question
Thought: Your reasoning.
    1. Check local documents first using 'document_search' for rules based on kommuneplanen.
    2. **Crucially:** Consider if the question would benefit from official guidance or further details from kristiansand.kommune.no or dibk.no. If yes, use 'search_internet' to find relevant pages/guides on those sites specifically. Search query should target these sites (e.g., "site:dibk.no garasje regler").
    3. Decide if you need to ask a question back (about project details like location/size, NOT which plan applies).
Action: one of [{tool_names}]
Action Input: input for the action.
Observation: result of the action (note local sources like document name/page, AND external URLs from search_internet, especially from kommune.no or dibk.no).
... (repeat Thought/Action/Action Input/Observation as needed)
Thought: I have the info from local docs and/or external search. Formulate the final response or clarifying question now. I will include relevant links found.
Final Answer: Your response to the user (answer or question).
    - Provide the answer based on findings.
    - Cite local sources if used (e.g., "Ifølge Kommuneplanen...").
    - **Include relevant links** found via 'search_internet', especially from Kristiansand Kommune or Dibk. Format them clearly, preferably using Markdown: `[Link Text](URL)` (e.g., `[Dibk veiviser for garasje](https://dibk.no/...)`).
    - Suggest 1-2 related follow-up questions if helpful.

**Begin!**

History: {chat_history}
User: {input}
Thought:{agent_scratchpad}
"""

        base_prompt = ChatPromptTemplate.from_template(prompt)

        tool_descriptions = "\n".join(f"- {tool.name}: {tool.description}" for tool in self.tools)
        tool_names = ", ".join([tool.name for tool in self.tools])

        agent_prompt = base_prompt.partial(
            tools=tool_descriptions,
            tool_names=tool_names
        )

        agent = create_react_agent(self.llm, self.tools, agent_prompt)

        self.agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            handle_parsing_errors=True,
            max_iterations=5,  # Increased slightly to allow for potential extra search step
            memory=self.memory,
            return_intermediate_steps=True
        )

        logger.info("PlanAgent initialized with CONCISE prompt encouraging external links.")

    def process(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Process a planning regulations query using the agent executor.
        Handles reset commands.
        """
        if query.lower() in ["reset", "nullstill samtale", "start på nytt"]:
            self.reset_memory()
            return {"answer": "Samtalen er nullstilt. Hva vil du snakke om nå?", "guides": []}

        logger.info(f"Processing sync query: {query[:50]}...")

        logger.info("Invoking agent executor...")
        try:
            result = self.agent_executor.invoke({"input": query})
            logger.info(f"AgentExecutor result dictionary: {result}")

            answer = result.get("output", None)

            # --- Fallback logic for parsing errors ---
            error_message_start = "En feil oppstod under behandling"
            if answer and answer.strip().startswith(error_message_start) and "intermediate_steps" in result:
                logger.warning("AgentExecutor hit a parsing error, attempting to extract Final Answer from last step.")
                steps = result["intermediate_steps"]
                if steps:
                    last_llm_output = steps[-1][0].log
                    if "Final Answer:" in last_llm_output:
                        try:
                            final_answer_text = last_llm_output.split("Final Answer:", 1)[1].strip()
                            if final_answer_text:
                                logger.info("Successfully extracted Final Answer from last step after parsing error.")
                                answer = final_answer_text
                            else:
                                logger.warning("Found 'Final Answer:' but text after it was empty.")
                                answer = "Jeg fant relevant informasjon, men klarte ikke å formatere det endelige svaret riktig. Vennligst prøv igjen."
                        except Exception as extract_err:
                            logger.error(f"Error extracting Final Answer after parsing error: {extract_err}")
                            answer = "Jeg støtte på et problem underveis i behandlingen av svaret. Vennligst prøv igjen."
                    else:
                        logger.warning("Parsing error occurred, but 'Final Answer:' not found in the last LLM output step.")
                        answer = "Jeg støtte på et problem underveis i behandlingen av svaret. Vennligst prøv igjen."
                else:
                    logger.warning("Parsing error occurred, but no intermediate steps were recorded.")
                    answer = "Jeg støtte på et problem underveis i behandlingen av svaret. Vennligst prøv igjen."

            if not answer:
                answer = "Beklager, jeg kunne ikke fullføre behandlingen av spørsmålet ditt."

            return {"answer": answer.strip(), "guides": []}

        except Exception as e:
            logger.error(f"Error during agent execution: {e}", exc_info=True)
            if isinstance(e, OutputParserException):
                 return {"answer": "Det oppstod en feil under formateringen av svaret. Prøv gjerne å omformulere spørsmålet.", "guides": []}
            return {"answer": "Beklager, en uventet feil oppstod.", "guides": []}

    async def aprocess(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Asynchronously process a planning regulations query using the agent executor.
        Handles reset commands.
        """
        if query.lower() in ["reset", "nullstill samtale", "start på nytt"]:
            self.reset_memory()
            return {"answer": "Samtalen er nullstilt. Hva vil du snakke om nå?", "guides": []}
        logger.info(f"Processing async query: {query[:50]}...")

        logger.info("Invoking agent executor asynchronously...")
        try:
            result = await self.agent_executor.ainvoke({"input": query})
            answer = result.get("output", "Sorry, I couldn't process your query (async).")
            return { "answer": answer.strip(), "guides": [] }
        except Exception as e:
            logger.error(f"Error invoking agent executor asynchronously: {e}", exc_info=True)
            return {
                "answer": "I encountered an issue while processing your question (async). Please try again or rephrase your query.",
                "guides": []
            }

    def reset_memory(self):
        self.memory.clear()
        logger.info("Conversation memory reset.")
