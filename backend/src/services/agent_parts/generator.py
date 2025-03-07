from langchain_openai import  AzureOpenAIEmbeddings
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI
from src.configuration import TAVILY_API_KEY

from src.configuration import (
   AZURE_EMBEDDING_API_KEY,  
    AZURE_EMBEDDING_DEPLOYMENT_NAME,
    GOOGLE_API_KEY_MODEL,
    GOOGLE_API_KEY,
    GEMINI_BASE_ENDPOINT,
    AZURE_EMBEDDING_ENDPOINT
)


# llm = AzureChatOpenAI(
#     api_key=AZURE_API_KEY,  
#     deployment_name=AZURE_DEPLOYMENT_NAME,
#     api_version=AZURE_API_VERSION,
#     azure_endpoint=AZURE_OPENAI_ENDPOINT,
#     temperature=0,
# )
llm = ChatGoogleGenerativeAI(
    model=GOOGLE_API_KEY_MODEL,
    google_api_key=GOOGLE_API_KEY,
    openai_api_base=GEMINI_BASE_ENDPOINT,
    temperature=0.3,
    convert_system_message_to_human=True,  

)



# Use separate key for embeddings
embedder = AzureOpenAIEmbeddings(
    azure_deployment=AZURE_EMBEDDING_DEPLOYMENT_NAME,
    api_key=AZURE_EMBEDDING_API_KEY, 
    api_version=AZURE_EMBEDDING_DEPLOYMENT_NAME,  
    azure_endpoint=AZURE_EMBEDDING_ENDPOINT,
    chunk_size=1,
    model="text-embedding-3-large",
)

web_search_tool = TavilySearchResults(
    tavily_api_key=TAVILY_API_KEY,
    k=3,
    max_results=5
)
