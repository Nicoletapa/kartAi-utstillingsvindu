import asyncio
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_core.tools import BaseTool
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class SearchTool(BaseTool):
    """A tool that performs a search on the internet using Tavily."""

    name: str = "Search_internet"
    description: str = (
        "Use this tool ONLY if the Vector Database does not contain the answer about building regulations OR if the question is about general knowledge, current events, external websites, or topics outside the scope of local planning documents. Input should be a search query."
    )
    tavily_tool: Optional[TavilySearchResults] = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.tavily_tool = TavilySearchResults(
            max_results=5,
            include_domains=["dibk.no", "kristiansand.kommune.no", "lovdata.no", 
                            "byggeregler.dibk.no", "kartverket.no"],
            k=5,
            include_raw_content=True,
            include_answer=True
        )
    
    def _run(self, query: str) -> str:
        return self.tavily_tool.run(query)
    
    async def _arun(self, query: str) -> str:
        return await self.tavily_tool.arun(query)


if __name__ == "__main__":
    search_tool = SearchTool()
    sync_result = search_tool.invoke("What can i build without searching for permission?")
    print("--- Sync Result ---")
    print(sync_result)

    async def run_async():
        async_result = await search_tool.ainvoke("How much distance can i have between my house and the road?")
        print("\n--- Async Result ---")
        print(async_result)
    asyncio.run(run_async())