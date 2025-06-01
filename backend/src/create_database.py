from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from langchain_chroma import Chroma 

from src.generator import embedder
from dotenv import load_dotenv
import os
import shutil

load_dotenv()

CHROMA_PATH = os.getenv("CHROMA_PATH")

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "backend", "src", "data")

def main():
    # Add path verification
    if not os.path.exists(DATA_PATH):
        print(f"Data directory not found at: {DATA_PATH}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Attempting to create data directory...")
        os.makedirs(DATA_PATH, exist_ok=True)
        return
    
    # List contents of data directory
    files = os.listdir(DATA_PATH)
    print(f"Files found in data directory: {files}")
    
    generate_data_store()

def generate_data_store():
    documents = load_documents()
    if not documents:
        print("No documents were loaded. Stopping process.")
        return
    
    chunks = split_text(documents)
    if not chunks:
        print("No chunks were created. Stopping process.")
        return
        
    save_to_chroma(chunks)

def load_documents():
    all_documents = []
    file_patterns = ("**/*.txt", "**/*.pdf", "**/*.md")
    
    for pattern in file_patterns:
        loader = DirectoryLoader(DATA_PATH, glob=pattern, use_multithreading=True, show_progress=True)
        try:   
            # Use a temporary variable to store the result
            pattern_documents = loader.load()
            all_documents.extend(pattern_documents)
            print(f"Loaded {len(pattern_documents)} documents with pattern '{pattern}' from {DATA_PATH}")
        except Exception as e:
            print(f"Error loading documents with pattern '{pattern}': {e}")
    
    print(f"Total loaded: {len(all_documents)} documents from {DATA_PATH}")
    return all_documents

def split_text(documents:list[Document]):
    if not documents:
        return []
        
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=200, 
        length_function=len, 
        add_start_index=True,
    )

    chunks = text_splitter.split_documents(documents)
    print(f"Split {len(documents)} documents into {len(chunks)} chunks.")
    return chunks

def save_to_chroma(chunks:list[Document]):
    if not chunks:
        print("No chunks to save to Chroma.")
        return
        
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
    
    try:
        embedding_function = embedder
        db = Chroma.from_documents(
            chunks,
            embedding_function,
            persist_directory=CHROMA_PATH 
        )
        print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")
    except Exception as e:
        print(f"Error saving to Chroma: {str(e)}")
        if os.path.exists(CHROMA_PATH):
            shutil.rmtree(CHROMA_PATH)
    
if __name__ == "__main__":
    main()