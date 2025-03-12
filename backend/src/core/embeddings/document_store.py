import os
import shutil
from typing import List, Optional, Tuple
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma  # Updated import statement
from langchain.prompts import ChatPromptTemplate
from langchain_community.document_loaders import TextLoader, DirectoryLoader
# Import embedding function and LLM from generator.py
from src.generator import embedder, llm

class DocumentStore:
    """Document store for retrieving building process information using embeddings."""
    
    CHROMA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "chroma")
    DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
    
    PROMPT_TEMPLATE = """
    Answer the question based only on the following context about Norwegian building regulations and application processes:
    
    {context}
    
    ---
    
    Question: {question}
    Answer:
    """
    
    def __init__(self, force_rebuild: bool = False):
        """
        Initialize the document store.
        
        Args:
            force_rebuild: If True, rebuild the document store even if it already exists.
        """
        # Use the embedding function imported from generator.py
        self.embedding_function = embedder
        
        # Create directories if they don't exist
        os.makedirs(self.DATA_PATH, exist_ok=True)
        
        # Initialize or rebuild the document store
        if force_rebuild or not os.path.exists(self.CHROMA_PATH):
            self._generate_data_store()
        
        # Connect to the existing database
        self.db = Chroma(
            persist_directory=self.CHROMA_PATH, 
            embedding_function=self.embedding_function
        )
    
    def _load_documents(self) -> List[Document]:
        """Load documents from the data directory."""
        
        
        # Use TextLoader for .txt files and DirectoryLoader for the directory
        try:
            loader = DirectoryLoader(self.DATA_PATH, glob="**/*.txt", loader_cls=TextLoader)
            documents = loader.load()
            return documents
        except Exception as e:
            print(f"Error loading documents: {e}")
            return []
    
    def _split_text(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            add_start_index=True,
        )
        
        chunks = text_splitter.split_documents(documents)
        print(f"Split {len(documents)} documents into {len(chunks)} chunks.")
        return chunks
    
    def _generate_data_store(self):
        """Generate the document store from the data directory."""
        # Remove existing Chroma directory if it exists
        if os.path.exists(self.CHROMA_PATH):
            shutil.rmtree(self.CHROMA_PATH)
        
        # Load and process documents
        documents = self._load_documents()
        if not documents:
            print("No documents found in the data directory.")
            return
        
        chunks = self._split_text(documents)
        
        # Create and persist the Chroma database
        db = Chroma.from_documents(
            chunks,
            self.embedding_function,
            persist_directory=self.CHROMA_PATH
        )
        db.persist()
        print(f"Saved {len(chunks)} chunks to {self.CHROMA_PATH}.")
    
    def query(self, query_text: str, k: int = 3) -> Tuple[str, List[str]]:
        """
        Query the document store with the given query text.
        
        Args:
            query_text: The query text.
            k: The number of results to return.
            
        Returns:
            A tuple containing the response text and a list of source documents.
        """
        # Find similar documents
        results = self.db.similarity_search_with_relevance_scores(query_text, k=k)
        if not results:
            return "No relevant information found for your query.", []
        
        # Format context from retrieved documents
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        
        # Create prompt with context
        prompt_template = ChatPromptTemplate.from_template(self.PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)
        
        # Use the LLM imported from generator.py
        response = llm.invoke(prompt)
        
        # Get source references
        sources = [doc.metadata.get("source", "Unknown") for doc, _score in results]
        
        return response.content, sources
