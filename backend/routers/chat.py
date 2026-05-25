import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from services import groq_llama, groq_qwen, groq_llama4

router = APIRouter()


class ChatRequest(BaseModel):
    session_id: str
    user_message: str


async def call_llm(service, session_id: str, user_message: str, llm_name: str) -> dict:
    try:
        reply = await asyncio.to_thread(service.chat, session_id, user_message)
        return {"llm": llm_name, "response": reply, "error": None}
    except Exception as e:
        return {"llm": llm_name, "response": None, "error": str(e)}


@router.post("/chat")
async def chat(request: ChatRequest):
    results = await asyncio.gather(
        call_llm(groq_llama, request.session_id, request.user_message, "llama"),
        call_llm(groq_qwen, request.session_id, request.user_message, "qwen"),
        call_llm(groq_llama4, request.session_id, request.user_message, "llama4"),
    )
    return {"results": list(results)}
