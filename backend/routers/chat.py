import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services import groq_llama, groq_qwen, groq_gpt

router = APIRouter()

SERVICE_MAP = {
    "llama": groq_llama,
    "qwen": groq_qwen,
    "gpt": groq_gpt,
}


class ChatRequest(BaseModel):
    session_id: str
    user_message: str


class StreamChatRequest(BaseModel):
    session_id: str
    user_message: str
    model: str


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
        call_llm(groq_gpt, request.session_id, request.user_message, "gpt"),
    )
    return {"results": list(results)}


@router.post("/chat/stream")
async def chat_stream(request: StreamChatRequest):
    service = SERVICE_MAP.get(request.model)
    if not service:
        return {"error": f"Unknown model: {request.model}"}

    def generate():
        try:
            for item in service.stream_chat(request.session_id, request.user_message):
                yield f"data: {json.dumps(item)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
