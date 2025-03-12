import os
from dotenv import load_dotenv

load_dotenv()

ARKIVGPT_URL = os.getenv("ARKIVGPT_URL", "http://localhost:80/api")
CADAID_URL = os.getenv("CADAID_URL", "http://localhost:5001/detect/")

#Gemini configuration 
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_API_KEY_MODEL = os.getenv("GOOGLE_API_KEY_MODEL")
GEMINI_BASE_ENDPOINT = os.getenv("GEMINI_BASE_ENDPOINT")
GEMINI_FULL_ENDPOINT = os.getenv("GEMINI_FULL_ENDPOINT")

# Embedding model configuration
AZURE_EMBEDDING_API_KEY = os.getenv("AZURE_OPENAI_API_KEY") 
AZURE_EMBEDDING_ENDPOINT = os.getenv("AZURE_EMBEDDING_ENDPOINT")  
AZURE_EMBEDDING_DEPLOYMENT_NAME = os.getenv("AZURE_EMBEDDING_DEPLOYMENT_NAME")


TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY")
LANGCHAIN_TRACING = os.getenv("LANGCHAIN_TRACING", "false") == "true"
