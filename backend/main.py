from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from core.database import init_db

load_dotenv()

app = FastAPI(title="Multi-LLM Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

@app.get("/health")
def health():
    return {"status": "ok"}
