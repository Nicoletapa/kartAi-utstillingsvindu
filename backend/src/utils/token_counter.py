import logging
import tiktoken
from typing import Dict, List, Optional, Union, Callable
from functools import lru_cache

logger = logging.getLogger(__name__)

# Cache encoder instances to avoid repeated initialization
@lru_cache(maxsize=4)
def _get_encoder(encoding_name: str):
    """
    Get a cached tokenizer encoder.
    
    Args:
        encoding_name: Name of the encoding to use
        
    Returns:
        Tiktoken encoder instance
    """
    try:
        return tiktoken.get_encoding(encoding_name)
    except Exception as e:
        logger.warning(f"Failed to get encoder {encoding_name}: {e}")
        # Fall back to cl100k_base which is used by GPT-4 and ChatGPT
        return tiktoken.get_encoding("cl100k_base")

def count_tokens(
    text: Union[str, List[Dict], List[str]],
    model: str = "gpt-4o-mini",
    encoding_name: Optional[str] = None
) -> int:
    """
    Count the number of tokens in a text string or message list.
    
    Args:
        text: Text string, list of message dictionaries, or list of strings to count tokens for
        model: Model name to determine encoding (default: gpt-4o-mini)
        encoding_name: Override encoding name (if not specified, derived from model)
        
    Returns:
        Number of tokens in the text
    """
    if text is None:
        return 0
        
    # Determine encoding based on model
    if encoding_name is None:
        if "gpt-4" in model:
            encoding_name = "cl100k_base"
        elif "gpt-3.5" in model:
            encoding_name = "cl100k_base"
        elif "text-embedding" in model:
            encoding_name = "cl100k_base"
        else:
            encoding_name = "cl100k_base"  # Default to GPT-4 encoding
    
    # Get encoder
    try:
        encoder = _get_encoder(encoding_name)
        
        # Count tokens based on input type
        if isinstance(text, str):
            return len(encoder.encode(text))
        elif isinstance(text, list):
            if all(isinstance(item, str) for item in text):
                # List of strings
                return sum(len(encoder.encode(item)) for item in text)
            elif all(isinstance(item, dict) for item in text):
                # List of message dictionaries (ChatCompletions format)
                return _count_message_tokens(text, encoder)
            else:
                # Mixed list, count individually
                total = 0
                for item in text:
                    if isinstance(item, str):
                        total += len(encoder.encode(item))
                    elif isinstance(item, dict) and "content" in item:
                        total += len(encoder.encode(item["content"]))
                return total
        else:
            logger.warning(f"Unsupported type for token counting: {type(text)}")
            return 0
    except Exception as e:
        logger.warning(f"Error counting tokens: {e}")
        return 0

def _count_message_tokens(messages: List[Dict], encoder) -> int:
    """
    Count tokens in a list of chat messages.
    
    Args:
        messages: List of message dictionaries
        encoder: Tiktoken encoder instance
        
    Returns:
        Number of tokens in the messages
    """
    total = 0
    
    # Add message-level overhead
    total += 3  # Every reply is primed with <|start|>assistant<|message|>
    
    for message in messages:
        # Count tokens in the message content
        content = message.get("content", "")
        if content:
            total += len(encoder.encode(content))
        
        # Count tokens in message role (3 for 'system', 1 each for 'user' and 'assistant')
        role = message.get("role", "user")
        if role == "system":
            total += 3
        else:
            total += 1
            
        # Add per-message overhead
        total += 3  # Every message follows <|start|>{role}<|message|>

    return total

def estimate_tokens(word_count: int) -> int:
    """
    Estimate the number of tokens based on word count.
    A rough approximation is that 1 token ≈ 0.75 words in English.
    
    Args:
        word_count: Number of words
        
    Returns:
        Estimated number of tokens
    """
    return int(word_count / 0.75)

class TokenTracker:
    """Track token usage over time or sessions."""
    
    def __init__(self):
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_tokens = 0
        self.calls = 0
    
    def add_usage(self, prompt_tokens: int, completion_tokens: int):
        """
        Add token usage from an API call.
        
        Args:
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens
        """
        self.total_prompt_tokens += prompt_tokens
        self.total_completion_tokens += completion_tokens
        self.total_tokens += prompt_tokens + completion_tokens
        self.calls += 1
    
    def get_stats(self) -> Dict:
        """
        Get token usage statistics.
        
        Returns:
            Dictionary with token usage statistics
        """
        return {
            "prompt_tokens": self.total_prompt_tokens,
            "completion_tokens": self.total_completion_tokens,
            "total_tokens": self.total_tokens,
            "api_calls": self.calls,
            "avg_tokens_per_call": self.total_tokens / max(1, self.calls)
        }
    
    def estimate_cost(self, prompt_price_per_1k: float = 0.01, completion_price_per_1k: float = 0.03) -> Dict:
        """
        Estimate cost of token usage.
        
        Args:
            prompt_price_per_1k: Price per 1,000 prompt tokens
            completion_price_per_1k: Price per 1,000 completion tokens
            
        Returns:
            Dictionary with cost estimates
        """
        prompt_cost = self.total_prompt_tokens * prompt_price_per_1k / 1000
        completion_cost = self.total_completion_tokens * completion_price_per_1k / 1000
        total_cost = prompt_cost + completion_cost
        
        return {
            "prompt_cost": prompt_cost,
            "completion_cost": completion_cost,
            "total_cost": total_cost
        }
    
    def reset(self):
        """Reset all counters."""
        self.total_prompt_tokens = 0
        self.total_completion_tokens = 0
        self.total_tokens = 0
        self.calls = 0


# Create a global token tracker instance
token_tracker = TokenTracker()

# Decorator to track token usage
def track_tokens(model="gpt-4o-mini", prompt_price_per_1k=0.01, completion_price_per_1k=0.03):
    """
    Decorator to track token usage of a function.
    
    Args:
        model: Model name for token counting
        prompt_price_per_1k: Price per 1,000 prompt tokens
        completion_price_per_1k: Price per 1,000 completion tokens
    
    Returns:
        Decorated function
    """
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            # Get prompt from args or kwargs
            prompt = None
            for arg in args:
                if isinstance(arg, (str, list)):
                    prompt = arg
                    break
            
            if prompt is None:
                for key, value in kwargs.items():
                    if key in ["prompt", "messages", "query", "text"] and isinstance(value, (str, list)):
                        prompt = value
                        break
            
            # Count prompt tokens if prompt is found
            prompt_tokens = 0
            if prompt is not None:
                prompt_tokens = count_tokens(prompt, model=model)
                logger.debug(f"Prompt tokens: {prompt_tokens}")
            
            # Call the original function
            result = func(*args, **kwargs)
            
            # Count completion tokens if result is found
            completion_tokens = 0
            if result is not None:
                if isinstance(result, str):
                    completion_tokens = count_tokens(result, model=model)
                elif isinstance(result, dict) and "content" in result:
                    completion_tokens = count_tokens(result["content"], model=model)
                elif isinstance(result, dict) and "answer" in result:
                    completion_tokens = count_tokens(result["answer"], model=model)
            
            # Track token usage
            token_tracker.add_usage(prompt_tokens, completion_tokens)
            
            # Log token usage
            logger.info(
                f"Token usage: prompt={prompt_tokens}, completion={completion_tokens}, "
                f"total={prompt_tokens + completion_tokens}, "
                f"cost=${(prompt_tokens * prompt_price_per_1k + completion_tokens * completion_price_per_1k) / 1000:.4f}"
            )
            
            return result
        return wrapper
    return decorator

# Usage example
if __name__ == "__main__":
    # Example usage
    text = "This is a test string to count tokens."
    token_count = count_tokens(text)
    print(f"Token count: {token_count}")
    
    # Example with tracker
    tracker = TokenTracker()
    tracker.add_usage(100, 50)
    print(tracker.get_stats())
    print(tracker.estimate_cost())