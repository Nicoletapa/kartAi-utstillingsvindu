import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from src.generator import llm, embedder, web_search_tool
from langchain_core.language_models.llms import BaseLLM
from src.utils.token_counter import count_tokens

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all agents"""
    
    def __init__(self, llm: Optional[BaseLLM] = None):
        """Initialize the agent with an optional LLM"""
        
        self.llm = llm or self._get_default_llm()
        self.embedder = embedder 
        self.web_search_tool = web_search_tool 
    
    def _get_default_llm(self) -> BaseLLM:
        """Get the default LLM from generator.py"""
        return llm
    
    @abstractmethod
    def process(self, query: str, **kwargs) -> Dict[str, Any]:
        """Process a user query and return a response"""
        pass
    
    def _log_token_usage(self, text: str, description: str):
        """Log token usage for a given text"""
        token_count = count_tokens(text)
        logger.info(f"{description} token count: {token_count}")
        return token_count