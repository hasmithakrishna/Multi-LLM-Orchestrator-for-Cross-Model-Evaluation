"use client";

import { useState, useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import PromptInput from "@/components/PromptInput";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Metrics = {
  latency: number;   // ms to first token
  duration: number;  // ms total
  tokens: number;    // completion tokens
};

type ToolEvent = {
  name: string;
  args: Record<string, unknown>;
  result: string;
};

type LLMState = {
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  metrics: Metrics | null;
  toolEvents: ToolEvent[];
  error: string | null;
};

const LLM_NAMES = ["llama", "qwen", "gpt"];

function createInitialState(): Record<string, LLMState> {
  return Object.fromEntries(
    LLM_NAMES.map((name) => [name, { messages: [], loading: false, streaming: false, metrics: null, toolEvents: [], error: null }])
  );
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [llmStates, setLlmStates] = useState<Record<string, LLMState>>(createInitialState());

  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  function handleClear() {
    setLlmStates(createInitialState());
    setSessionId(crypto.randomUUID());
  }

  async function streamModel(model: string, message: string) {
    const sendTime = Date.now();
    let firstTokenAt: number | null = null;
    let completionTokens: number | null = null;

    try {
      const res = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, user_message: message, model }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);

          if (payload === "[DONE]") {
            const metrics: Metrics | null = firstTokenAt
              ? { latency: firstTokenAt - sendTime, duration: Date.now() - sendTime, tokens: completionTokens ?? 0 }
              : null;
            setLlmStates((prev) => ({
              ...prev,
              [model]: { ...prev[model], loading: false, streaming: false, metrics },
            }));
            return;
          }

          const parsed = JSON.parse(payload);

          if (parsed.error) {
            setLlmStates((prev) => ({
              ...prev,
              [model]: { ...prev[model], loading: false, streaming: false, error: parsed.error },
            }));
            return;
          }

          if (parsed.usage) {
            completionTokens = parsed.usage.tokens;
          }

          if (parsed.tool_used) {
            setLlmStates((prev) => {
              const msgs = [...prev[model].messages];
              // Drop any partial assistant message streamed before the tool call
              if (msgs[msgs.length - 1]?.role === "assistant") msgs.pop();
              return {
                ...prev,
                [model]: {
                  ...prev[model],
                  messages: msgs,
                  streaming: false,
                  toolEvents: [...prev[model].toolEvents, parsed.tool_used],
                },
              };
            });
          }

          if (parsed.token) {
            if (!firstTokenAt) firstTokenAt = Date.now();
            setLlmStates((prev) => {
              const msgs = [...prev[model].messages];
              const last = msgs[msgs.length - 1];
              if (last?.role === "assistant") {
                msgs[msgs.length - 1] = { role: "assistant", content: last.content + parsed.token };
              } else {
                msgs.push({ role: "assistant", content: parsed.token });
              }
              return { ...prev, [model]: { ...prev[model], messages: msgs, streaming: true } };
            });
          }
        }
      }
    } catch {
      setLlmStates((prev) => ({
        ...prev,
        [model]: { ...prev[model], loading: false, streaming: false, error: "Failed to reach backend." },
      }));
    }
  }

  async function handleSend(message: string) {
    if (!sessionId) return;
    setLlmStates((prev) => {
      const updated = { ...prev };
      LLM_NAMES.forEach((name) => {
        updated[name] = {
          ...updated[name],
          messages: [...updated[name].messages, { role: "user", content: message }],
          loading: true,
          streaming: false,
          metrics: null,
          toolEvents: [],
          error: null,
        };
      });
      return updated;
    });
    await Promise.all(LLM_NAMES.map((model) => streamModel(model, message)));
  }

  const isLoading = LLM_NAMES.some((name) => llmStates[name].loading);

  return (
    <div className="flex flex-col h-screen" style={{ background: "#090910", color: "white" }}>

      <header
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#0b0b14" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
            style={{ background: "linear-gradient(135deg, #6366f1, #34d399)" }}
          >
            ✦
          </div>
          <div>
            <h1 className="text-base font-semibold text-white leading-none">Multi-LLM Orchestrator</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
              LLaMA · Qwen · GPT in parallel
            </p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-xs font-medium px-4 py-2 rounded-lg transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          + New Chat
        </button>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {LLM_NAMES.map((name) => (
          <ChatPanel
            key={name}
            llmName={name}
            messages={llmStates[name].messages}
            loading={llmStates[name].loading}
            streaming={llmStates[name].streaming}
            metrics={llmStates[name].metrics}
            toolEvents={llmStates[name].toolEvents}
            error={llmStates[name].error}
          />
        ))}
      </div>

      <PromptInput onSend={handleSend} loading={isLoading} />
    </div>
  );
}
