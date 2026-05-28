import os
from groq import Groq
from core.database import (
    save_message, load_recent_history, load_oldest_messages,
    count_messages, delete_oldest_messages, save_summary, load_summary
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

LLM_NAME = "gpt"
MODEL = "openai/gpt-oss-120b"
SYSTEM_PROMPT = "You are a helpful assistant. Answer clearly and concisely."
RECENT_LIMIT = 10


def chat(session_id: str, user_message: str) -> str:
    summary = load_summary(session_id, LLM_NAME)
    recent = load_recent_history(session_id, LLM_NAME, RECENT_LIMIT)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if summary:
        messages.append({
            "role": "system",
            "content": f"Summary of earlier conversation: {summary}"
        })
    messages += recent
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        timeout=15,
    )
    reply = response.choices[0].message.content

    save_message(session_id, LLM_NAME, "user", user_message)
    save_message(session_id, LLM_NAME, "assistant", reply)

    if count_messages(session_id, LLM_NAME) > RECENT_LIMIT:
        old_messages = load_oldest_messages(session_id, LLM_NAME, 1)
        prev_summary = summary or ""
        summarize_prompt = [
            {"role": "system", "content": (
                f"Summarize this conversation in 2-3 sentences."
                f"{' Previous summary: ' + prev_summary if prev_summary else ''}"
            )}
        ] + old_messages
        summary_response = client.chat.completions.create(
            model=MODEL,
            messages=summarize_prompt,
            timeout=15,
        )
        save_summary(session_id, LLM_NAME, summary_response.choices[0].message.content)
        delete_oldest_messages(session_id, LLM_NAME, 1)

    return reply


def stream_chat(session_id: str, user_message: str):
    import json
    from services.tools import TOOLS, execute_tool

    summary = load_summary(session_id, LLM_NAME)
    recent = load_recent_history(session_id, LLM_NAME, RECENT_LIMIT)

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if summary:
        messages.append({"role": "system", "content": f"Summary of earlier conversation: {summary}"})
    messages += recent
    messages.append({"role": "user", "content": user_message})

    full_reply = ""

    try:
        stream = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS,
            tool_choice="auto", stream=True, timeout=30,
        )

        tool_call_data = {}
        finish_reason = None

        for chunk in stream:
            if not chunk.choices:
                continue
            choice = chunk.choices[0]
            finish_reason = choice.finish_reason or finish_reason
            delta = choice.delta

            if delta.content:
                full_reply += delta.content
                yield {"token": delta.content}

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_call_data:
                        tool_call_data[idx] = {"id": "", "name": "", "arguments": ""}
                    if tc.id:
                        tool_call_data[idx]["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            tool_call_data[idx]["name"] += tc.function.name
                        if tc.function.arguments:
                            tool_call_data[idx]["arguments"] += tc.function.arguments

        if finish_reason == "tool_calls" and tool_call_data:
            assistant_msg = {
                "role": "assistant",
                "content": full_reply or None,
                "tool_calls": [
                    {"id": d["id"], "type": "function",
                     "function": {"name": d["name"], "arguments": d["arguments"]}}
                    for d in tool_call_data.values()
                ]
            }
            tool_result_msgs = []
            for d in tool_call_data.values():
                args = json.loads(d["arguments"])
                result = execute_tool(d["name"], args)
                yield {"tool_used": {"name": d["name"], "args": args, "result": result}}
                tool_result_msgs.append({"role": "tool", "tool_call_id": d["id"], "content": result})

            full_reply = ""
            final_stream = client.chat.completions.create(
                model=MODEL,
                messages=messages + [assistant_msg] + tool_result_msgs,
                stream=True, timeout=30,
            )
            for chunk in final_stream:
                token = chunk.choices[0].delta.content if chunk.choices else ""
                if token:
                    full_reply += token
                    yield {"token": token}

    except Exception:
        stream = client.chat.completions.create(
            model=MODEL, messages=messages, stream=True, timeout=30,
        )
        for chunk in stream:
            token = chunk.choices[0].delta.content if chunk.choices else ""
            if token:
                full_reply += token
                yield {"token": token}

    yield {"usage": {"tokens": round(len(full_reply) / 4)}}

    save_message(session_id, LLM_NAME, "user", user_message)
    save_message(session_id, LLM_NAME, "assistant", full_reply)

    if count_messages(session_id, LLM_NAME) > RECENT_LIMIT:
        old_messages = load_oldest_messages(session_id, LLM_NAME, 1)
        prev_summary = summary or ""
        summarize_prompt = [
            {"role": "system", "content": (
                f"Summarize this conversation in 2-3 sentences."
                f"{' Previous summary: ' + prev_summary if prev_summary else ''}"
            )}
        ] + old_messages
        summary_response = client.chat.completions.create(
            model=MODEL, messages=summarize_prompt, timeout=15,
        )
        save_summary(session_id, LLM_NAME, summary_response.choices[0].message.content)
        delete_oldest_messages(session_id, LLM_NAME, 1)
