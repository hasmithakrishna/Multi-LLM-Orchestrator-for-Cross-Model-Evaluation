import os
from groq import Groq
from core.database import save_message, load_history

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LLM_NAME = "llama4"
MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"


def chat(session_id: str, user_message: str) -> str:
    history = load_history(session_id, LLM_NAME)

    save_message(session_id, LLM_NAME, "user", user_message)

    messages = history + [{"role": "user", "content": user_message}]

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        timeout=15,
    )

    reply = response.choices[0].message.content

    save_message(session_id, LLM_NAME, "assistant", reply)

    return reply
