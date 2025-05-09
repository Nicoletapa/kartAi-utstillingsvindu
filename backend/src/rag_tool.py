import os
import logging
from typing import List, Tuple, Optional, ClassVar

from langchain_core.tools import BaseTool
from langchain_core.documents import Document
from langchain_chroma import Chroma
from pydantic.v1 import Field, BaseModel, PrivateAttr
from dotenv import load_dotenv

from src.generator import embedder
from src.create_database import CHROMA_PATH as REL_CHROMA_PATH

load_dotenv()
logger = logging.getLogger(__name__)

class DocumentSearchInput(BaseModel):
    """Input for the document search tool."""
    query: str = Field(..., description="The search query for building regulations or application information")

class DocumentSearchTool(BaseTool):
    """A tool for searching local document store for building regulations information."""

    name: str = "document_search"
    description: str = (
        "Searches Kristiansand Municipality's local documents for general building regulations, permit requirements, application processes, and guidance (based on 'Kommuneplanbestemmelser' - general municipal plan provisions - and related official guidelines). Use for questions about general local building rules and procedures. This tool provides information based on general municipal-wide provisions, NOT specific 'reguleringsplaner' (detailed zoning plans for local areas)."
    )
    args_schema: type[DocumentSearchInput] = DocumentSearchInput
    return_direct: bool = False

    # --- Configuration ---
    BASE: ClassVar[str] = os.path.dirname(os.path.abspath(__file__))
    chroma_path: ClassVar[str] = os.getenv(
        "CHROMA_PATH",
        os.path.join(BASE, REL_CHROMA_PATH)
    )
    print(f"Chroma path: {os.path.abspath(__file__)}")
    search_k: ClassVar[int] = int(os.getenv("RAG_SEARCH_K", 3))
    relevance_threshold: ClassVar[float] = float(os.getenv("RAG_RELEVANCE_THRESHOLD", 0.4))

    # --- Private attribute for Chroma client ---
    _db: Optional[Chroma] = PrivateAttr(default=None)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        try:
            self._db = Chroma(
                persist_directory=self.chroma_path,
                embedding_function=embedder
            )
            logger.info(f"Chroma client initialized for path: {self.chroma_path}")
        except Exception as e:
            logger.error(f"Failed to initialize Chroma client: {e}", exc_info=True)
            raise ConnectionError(f"Could not connect to Chroma DB at {self.chroma_path}") from e

    def _format_results(self, results: List[Tuple[Document, float]]) -> str:
        """Helper method to format search results."""
        if not results:
            return "No documents found matching the query."

        formatted_result = ""
        relevant_docs_found = False
        temp_results = []
        scores_found = [score for _, score in results]

        for i, (doc, score) in enumerate(results, 1):
            if score >= self.relevance_threshold:
                relevant_docs_found = True
                source = doc.metadata.get("source", "Unknown source")
                source_name = os.path.basename(source) if source else "Unknown"
                page = doc.metadata.get("page", None)
                source_display = f"from {source_name}"
                if page is not None:
                    source_display += f" (Page {page})"

                excerpt = f"--- Excerpt {i} (Relevance: {score:.2f}) {source_display} ---\n"
                excerpt += doc.page_content.strip()
                excerpt += "\n\n"
                temp_results.append(excerpt)

        if relevant_docs_found:
            formatted_result = "Here's relevant information from the building regulations:\n\n" + "".join(temp_results)
            logger.info(f"DocumentSearchTool returning {len(temp_results)} relevant excerpts (threshold >= {self.relevance_threshold}).")
        else:
            max_score_str = f"{max(scores_found):.4f}" if scores_found else "N/A"
            logger.warning(f"DocumentSearchTool found docs, but none met threshold >= {self.relevance_threshold}. Max score: {max_score_str}")
            return "No relevant excerpts found in local documents."

        return formatted_result.strip()

    def _run(self, query: str) -> str:
        """Execute the search against the document store."""
        if self._db is None:
            return "Error: Document database connection is not available."
        try:
            logger.info(f"DocumentSearchTool (_run) received query: {query}")
            results = self._db.similarity_search_with_relevance_scores(
                query, k=self.search_k
            )
            return self._format_results(results)
        except Exception as e:
            logger.error(f"Error querying document store: {e}", exc_info=True)
            return f"Error: Failed to search the building regulations database. Technical details: {str(e)}"

    async def _arun(self, query: str) -> str:
        """Execute the search asynchronously against the document store."""
        if self._db is None:
            return "Error: Document database connection is not available."
        try:
            logger.info(f"DocumentSearchTool (_arun) received query: {query}")
            results = await self._db.asimilarity_search_with_relevance_scores(
                query, k=self.search_k
            )
            return self._format_results(results)
        except Exception as e:
            logger.error(f"Error querying document store asynchronously: {e}", exc_info=True)
            return f"Error: Failed to search the building regulations database asynchronously. Please try again later."

if __name__ == "__main__":
    try:
        from src.rag_tool import DocumentSearchTool
        print("BASE path:", DocumentSearchTool.BASE)
        print("Chroma path:", DocumentSearchTool.chroma_path)

        tool = DocumentSearchTool()

        if tool._db:
            print(f"Total documents in database: {tool._db._collection.count()}")
        else:
            print("Database client not initialized.")
            exit()

        test_query = "jeg vil bygge en garasje under 50 kvm. må jeg søke om tillatelse?"
        result = tool._run(test_query)

        print(f"\nQuery: {test_query}")
        print(f"Using k={tool.search_k}, threshold={tool.relevance_threshold}")
        print("\nResults:")
        print(result)

    except Exception as main_err:
        print(f"Error during testing: {main_err}")



