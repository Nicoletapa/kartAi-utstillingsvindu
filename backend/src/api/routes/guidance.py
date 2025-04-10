from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.document_store import DocumentStore

# Initialize document store as a singleton
_document_store = None

def get_document_store() -> DocumentStore:
    """Get or create the document store."""
    global _document_store
    if _document_store is None:
        _document_store = DocumentStore()
    return _document_store

router = APIRouter()

class GuidanceQuery(BaseModel):
    """Model for guidance query."""
    query: str

class GuidanceResponse(BaseModel):
    """Model for guidance response."""
    answer: str
    sources: List[str]

@router.post("/query", response_model=GuidanceResponse)
async def query_guidance(
    query_data: GuidanceQuery, 
    document_store: DocumentStore = Depends(get_document_store)
):
    """Query building guidance information."""
    if not query_data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    try:
        answer, sources = document_store.query(query_data.query)
        return GuidanceResponse(answer=answer, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")
