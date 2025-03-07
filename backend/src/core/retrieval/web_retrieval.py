import os
import logging
import time
from typing import List, Dict, Any, Optional
import requests

logger = logging.getLogger(__name__)

class WebRetriever:
    """Service for retrieving information from the web"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("TAVILY_API_KEY")
        self.base_url = "https://api.tavily.com/search"
        
    def search(self, query: str, max_results: int = 3, include_domains: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Search the web for relevant information
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            include_domains: Optional list of domains to restrict search to
        
        Returns:
            List of search results
        """
        logger.info(f"Web search: {query}")
        
        if not self.api_key:
            logger.error("No Tavily API key provided")
            return []
        
        try:
            headers = {
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
            
            params = {
                "query": query,
                "max_results": max_results,
                "search_depth": "moderate"
            }
            
            if include_domains:
                params["include_domains"] = include_domains
            
            response = requests.post(
                self.base_url,
                headers=headers,
                json=params
            )
            
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            logger.info(f"Found {len(results)} web search results")
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching web: {e}")
            return []
            
    def search_building_guides(self, query: str) -> List[Dict[str, Any]]:
        """
        Search specifically for building guides
        
        Args:
            query: The user's query
            
        Returns:
            List of guide results with title, URL, and description
        """
        # Create domain-specific searches 
        dibk_query = f"site:dibk.no byggveiviser {query}"
        kristiansand_query = f"site:kristiansand.kommune.no {query} byggesak veiviser"
        
        try:
            # Search DIBK
            dibk_results = self.search(dibk_query, max_results=2)
            time.sleep(1)  # Avoid rate limits
            
            # Search Kristiansand
            kristiansand_results = self.search(kristiansand_query, max_results=2)
            
            # Combine results
            combined_results = []
            if dibk_results:
                combined_results.extend(dibk_results[:2])
            if kristiansand_results:
                combined_results.extend(kristiansand_results[:1])
            
            # Format results as guide buttons
            guides = []
            for result in combined_results[:3]:  # Limit to top 3
                guides.append({
                    "title": result.get("title"),
                    "url": result.get("url"),
                    "description": result.get("snippet")
                })
            
            return guides
            
        except Exception as e:
            logger.error(f"Error searching for building guides: {e}")
            return []