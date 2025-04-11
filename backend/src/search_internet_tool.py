import os
import asyncio
from langchain_core.tools import BaseTool
from tavily import TavilyClient, AsyncTavilyClient 
from dotenv import load_dotenv
from pydantic.v1 import BaseModel, Field

load_dotenv()

tavily_api_key = os.getenv("TAVILY_API_KEY")

class SearchInput(BaseModel):
    query:str = Field(description="The search query string the user asked about.")


class SearchTool(BaseTool):
    """A tool that performs a search on the internet using Tavily."""

    name: str = "Search_internet"
    description: str = (
        "Use this tool ONLY if the Vector Database does not contain the answer about building regulations OR if the question is about general knowledge, current events, external websites, or topics outside the scope of local planning documents. Input should be a search query."
    
    )
    args_schema: type[BaseModel]= SearchInput
   

    def _run(self, query: str) -> str:
        """Use the tool synchronously."""
        if not tavily_api_key:
            return "Tavily API key not found. Please set the TAVILY_API_KEY environment variable."
        try:
            tavily_client = TavilyClient(api_key=tavily_api_key)
            response = tavily_client.search(query=query, search_depth="basic", max_results=5)
            results = response.get('results', [])
            answer = response.get('answer', None)

            output = f"Tavily Search Results for '{query}':\n"
            if answer:
                 output += f"Answer: {answer}\n\n" 

            if results:
                formatted_results = []
                for res in results:
                    title = res.get('title', 'No Title Provided')
                    snippet = res.get('snippet', 'No Snippet Available')
                    url = res.get('url', 'No URL Provided')
                    formatted_results.append(f"- {title}: {snippet}\nURL: {url}")

                output += "\n".join(formatted_results)
            elif not answer: 
                 output += "No results found."

            return output
        except Exception as e:
            return f"Error during Tavily search: {e}"

    # async def _arun(self, query: str) -> str:
    #     """Use the tool asynchronously."""
    #     if not tavily_api_key:
    #         return "Tavily API key not found. Please set the TAVILY_API_KEY environment variable."
    #     try:
    #         # Initialize asynchronous client
    #         async_tavily_client = AsyncTavilyClient(api_key=tavily_api_key)
    #         # Perform search asynchronously
    #         response = await async_tavily_client.search(query=query, search_depth="basic", max_results=5)
    #         # Extract and format results (same as sync version)
    #         results = response.get('results', [])
    #         answer = response.get('answer', None)
            
    #         output = f"Tavily Search Results for '{query}':\n"
    #         if answer:
    #              output += f"Answer: {answer}\n\n"
    #         if results:
    #             output += "\n".join([f"- {res['title']}: {res['snippet']}\nURL: {res['url']}" for res in results])
    #         elif not answer:
    #              output += "No results found."

    #         return output
            
    #     except Exception as e:
    #         return f"Error during async Tavily search: {e}"


if __name__ == "__main__":
    search_tool = SearchTool()
    sync_result = search_tool.invoke("What's the weather like in Kristiansand today?")
    print("--- Sync Result ---")
    print(sync_result)

    # async def run_async():
    #     async_result = await search_tool.ainvoke("Latest news about AI advancements?")
    #     print("\n--- Async Result ---")
    #     print(async_result)
    # asyncio.run(run_async())