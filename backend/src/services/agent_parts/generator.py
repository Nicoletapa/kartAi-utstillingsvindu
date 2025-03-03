from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.tools.tavily_search import TavilySearchResults
from src.configuration import TAVILY_API_KEY

from src.configuration import (
    AZURE_API_KEY,  
    AZURE_API_VERSION,
    AZURE_DEPLOYMENT_NAME,
    AZURE_OPENAI_ENDPOINT,
    AZURE_EMBEDDING_DEPLOYMENT_NAME,
)


llm = AzureChatOpenAI(
    api_key=AZURE_API_KEY,  
    deployment_name=AZURE_DEPLOYMENT_NAME,
    api_version=AZURE_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    temperature=0,
)

# Use separate key for embeddings
embedder = AzureOpenAIEmbeddings(
    azure_deployment=AZURE_EMBEDDING_DEPLOYMENT_NAME,
    api_key=AZURE_API_KEY,  # Use AZURE_API_KEY here too
    api_version=AZURE_API_VERSION,  # Use AZURE_API_VERSION, not AZURE_OPENAI_API_VERSION
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    chunk_size=1,
    model="text-embedding-3-large",
)

web_search_tool = TavilySearchResults(
    tavily_api_key=TAVILY_API_KEY,
    k=3,
    max_results=5
)
