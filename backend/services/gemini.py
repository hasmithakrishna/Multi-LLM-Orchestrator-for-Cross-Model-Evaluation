import os
import google.generativeai as genai
from core.database import save_message, load_history

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

LLM_NAME = "gemini"
MODEL = "gemini-2.0-flash"


def chat(session_id: str, user_message: str) -> str:
    history = load_history(session_id, LLM_NAME)

    save_message(session_id, LLM_NAME, "user", user_message)

    gemini_history = [
        {"role": "user" if msg["role"] == "user" else "model", "parts": [msg["content"]]}
        for msg in history
    ]

    model = genai.GenerativeModel(MODEL)
    conversation = model.start_chat(history=gemini_history)

    response = conversation.send_message(user_message)
    reply = response.text

    save_message(session_id, LLM_NAME, "assistant", reply)

    return reply
