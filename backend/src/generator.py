from langchain_openai import  AzureOpenAIEmbeddings
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI


from src.configuration import (
   AZURE_EMBEDDING_API_KEY,  
    AZURE_EMBEDDING_DEPLOYMENT_NAME,
    AZURE_EMBEDDING_DEPLOYMENT_VERSION,
    GOOGLE_API_KEY_MODEL,
    GOOGLE_API_KEY,
    GEMINI_BASE_ENDPOINT,
    AZURE_EMBEDDING_ENDPOINT,
    TAVILY_API_KEY
)


llm = ChatGoogleGenerativeAI(
    model=GOOGLE_API_KEY_MODEL,
    google_api_key=GOOGLE_API_KEY,
    temperature=0.3,
    
)


# Use separate key for embeddings
embedder = AzureOpenAIEmbeddings(
    model=AZURE_EMBEDDING_DEPLOYMENT_NAME,
    api_key=AZURE_EMBEDDING_API_KEY, 
    api_version=AZURE_EMBEDDING_DEPLOYMENT_VERSION,  
    azure_endpoint=AZURE_EMBEDDING_ENDPOINT,
    chunk_size=1
    
)

web_search_tool = TavilySearchResults(
    tavily_api_key=TAVILY_API_KEY,
    k=3,
    max_results=5
)
