from src.generator import embedder, llm
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
import argparse
import os
import logging

logger = logging.getLogger(__name__)

class DocumentStore:
    
    CHROMA_PATH = os.getenv("CHROMA_PATH", "chroma")
    PROMPT_TEMPLATE = """
        Answer the question based only on the following context about Norwegian building regulations and application processes:
    
        {context}
    
        ---
    
        Question: {question}
        Answer:
        """

    def __init__(self):
        """Initialize the DocumentStore with necessary components"""
        # Store embedding function as instance variable
        self.embedding_function = embedder
    
    def query(self, query_text: str) -> str:
        """
        Query the document store with a user question and return relevant context
        
        Args:
            query_text: The user's query
                
        Returns:
            String containing the relevant context from documents
        """
        try:
            # Initialize the Chroma client with the embedding function
            db = Chroma(persist_directory=self.CHROMA_PATH, embedding_function=self.embedding_function)
            
            # Perform similarity search
            results = db.similarity_search_with_relevance_scores(query_text, k=3)
            
            if not results:
                return "No relevant information found in the building regulations."
            
            # Extract content from the search results
            context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
            
            return context_text
            
        except Exception as e:
            logger.error(f"Error querying document store: {e}")
            return "Failed to retrieve relevant building regulation information."

    @staticmethod
    def main():
        # Debug info
        print(f"CHROMA_PATH: {os.path.abspath(DocumentStore.CHROMA_PATH)}")
        print(f"Directory exists: {os.path.exists(DocumentStore.CHROMA_PATH)}")
        if os.path.exists(DocumentStore.CHROMA_PATH):
            print(f"Contents: {os.listdir(DocumentStore.CHROMA_PATH)}")
            
        parser = argparse.ArgumentParser()
        parser.add_argument("query_text", type=str, help="The query text.")
        args = parser.parse_args()
        query_text = args.query_text
        
        embedding_function = embedder
        db = Chroma(persist_directory=DocumentStore.CHROMA_PATH, embedding_function=embedding_function)
        
        results = db.similarity_search_with_relevance_scores(query_text, k=3)
        print(f"Basic search found {len(results)} results")
        
        context_text = "\n\n---\n\n".join([doc.page_content for doc, _score in results])
        prompt_template = ChatPromptTemplate.from_template(DocumentStore.PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context_text, question=query_text)
        print(prompt)
       
        model = llm
        response = model.invoke(prompt)
        
        response_text = response.content

        sources = [doc.metadata.get("source", None) for doc, _score in results]
        formatted_response = f"Response: {response_text}\n\nSources: {sources}"
        print(formatted_response)

if __name__ == "__main__":
    DocumentStore.main()