from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import init_db
from routers import chat

app = FastAPI(title="Multi-LLM Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
