from fastapi import FastAPI, UploadFile, File, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
from dotenv import load_dotenv

# LangChain Imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains import create_retrieval_chain

load_dotenv()

app = FastAPI(title="KaladiMind RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHROMA_PATH = "chroma_db"

print("Loading AI Embedding Model (This takes a moment on startup...)")
global_embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
print("Model loaded and ready!")

class ChatRequest(BaseModel):
    question: str

@app.get("/")
async def root():
    return {"status": "success", "message": "Backend is running!"}

# --- NEW: Endpoint to clear AI memory ---
@app.delete("/api/clear")
async def clear_document():
    if os.path.exists(CHROMA_PATH):
        try:
            old_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=global_embeddings)
            old_db.delete_collection()
        except Exception:
            pass
    return {"message": "Memory cleared."}

@app.post("/api/upload")
async def upload_and_process_pdf(response: Response, file: UploadFile = File(...)):
    
    # 1. Clear old database if it exists
    if os.path.exists(CHROMA_PATH):
        try:
            old_db = Chroma(persist_directory=CHROMA_PATH, embedding_function=global_embeddings)
            old_db.delete_collection()
        except Exception:
            pass
            
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Extract text from PDF
        loader = PyPDFLoader(temp_file_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)

        # 3. Guardrail: Check for empty or scanned PDFs
        if len(chunks) == 0:
            os.remove(temp_file_path)
            response.status_code = 400
            return {"error": "No readable text found. This PDF might be a scanned image or blank."}

        # 4. Save to Chroma Database
        db = Chroma.from_documents(
            documents=chunks, 
            embedding=global_embeddings, 
            persist_directory=CHROMA_PATH
        )

        os.remove(temp_file_path)

        return {
            "message": "PDF successfully processed and database refreshed!",
            "total_chunks_saved": len(chunks)
        }
        
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        response.status_code = 400
        return {"error": str(e)}

@app.post("/api/chat")
async def chat_with_document(request: ChatRequest):
    try:
        llm = ChatGroq(
            temperature=0, 
            model_name="llama-3.1-8b-instant"
        )
        
        # --- THE PROFESSIONAL GUARDRAIL PROMPT ---
        system_prompt = (
            "You are KaladiMind, an enterprise document intelligence AI. "
            "RULE 1: ONLY mention your name or your developer (Zahoor Ahmed Kaladi) IF the user explicitly asks who you are, who built you, or who created you. Otherwise, never introduce yourself. "
            "RULE 2: Your strict purpose is to answer the user's question based ONLY on the provided Context below. "
            "RULE 3: if the user asks any question without uploading a file, give them a brief reply professionally according to their question and ask them to upload a file for assistance. Do not hallucinate external knowledge.\n\n   "
            "RULE 4: If the answer cannot be found in the Context, or if the user asks a vague question, reply professionally with exactly this: "
            "' Could you please clarify your question or ask about a specific topic in the file?' "
            "Do not hallucinate external knowledge.\n\n"
            "Context: {context}"
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])

        # Safely handle the chat whether a database exists yet or not
        if not os.path.exists(CHROMA_PATH):
            return {
                "question": request.question,
                "answer": "There is currently no document uploaded to my memory. Please initialize the database with a PDF so I can assist you!"
            }

        # If database exists, proceed with standard RAG retrieval
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=global_embeddings)
        retriever = db.as_retriever(search_kwargs={"k": 3})
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)

        response = rag_chain.invoke({"input": request.question})

        return {
            "question": request.question,
            "answer": response["answer"]
        }

    except Exception as e:
        return {"error": str(e)}