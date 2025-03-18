from langchain_community.document_loaders import DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from langchain_chroma import Chroma 

from generator import embedder, llm

import os
import shutil



CHROMA_PATH ="chroma"

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "src/data")

def main():
    generate_data_store()


def generate_data_store():
    documents = load_documents()
    chunks = split_text(documents)
    save_to_chroma(chunks)


def load_documents():
    loader = DirectoryLoader(DATA_PATH, glob="*.md")
    documents = loader.load()
    return documents


def split_text(documents:list[Document]):
    
    text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, 
    chunk_overlap=500, 
    length_function=len, 
    add_start_index=True,
)

    chunks = text_splitter.split_documents(documents)
    print (f"Split {len(documents)} documents into {len(chunks)} chunks.")
    
    document = chunks[5]
    print(document.page_content)
    print(document.metadata)

    return chunks


def save_to_chroma(chunks:list[Document]):
    if os.path.exists(CHROMA_PATH):
        shutil.rmtree(CHROMA_PATH)
    
  
    
    embedding_function = embedder
    
    db = Chroma.from_documents(
        chunks,
        embedding_function,
        persist_directory=CHROMA_PATH 
    )
    
    print(f"Saved {len(chunks)} chunks to {CHROMA_PATH}.")
    
if __name__ == "__main__":
    main()