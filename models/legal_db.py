import json
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load JSON dataset
with open("IndicLegalQA Dataset_10K_Revised.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Extract relevant text (combine case name, date, question, and answer for context)
documents = []
for entry in data:
    case_text = f"Case: {entry['case_name']} | Date: {entry['judgement_date']}\nQuestion: {entry['question']}\nAnswer: {entry['answer']}"
    documents.append(case_text)

# Split text into chunks for embedding
text_splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)
document_chunks = text_splitter.create_documents(documents)

# Use BGE embeddings from HuggingFace
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en")

# Store in FAISS for fast retrieval
vector_store = FAISS.from_documents(document_chunks, embeddings)
vector_store.save_local("faiss_legal_db")

print("Legal dataset successfully stored in FAISS!")
