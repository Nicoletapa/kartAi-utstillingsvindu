import os
from dotenv import load_dotenv

load_dotenv()

ARKIVGPT_URL = os.getenv("ARKIVGPT_URL", "http://localhost:80/api")
CADAID_URL = os.getenv("CADAID_URL", "http://localhost:5001/detect/")

# Chat model configuration
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")

# Embedding model configuration
AZURE_EMBEDDING_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", AZURE_API_KEY) 
AZURE_EMBEDDING_ENDPOINT = os.getenv("AZURE_EMBEDDING_ENDPOINT")  
AZURE_EMBEDDING_DEPLOYMENT_NAME = os.getenv("AZURE_EMBEDDING_DEPLOYMENT_NAME")

# Keep this for other services that might need direct OpenAI API
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
LANGCHAIN_TRACING = os.getenv("LANGCHAIN_TRACING", "false") == "true"
