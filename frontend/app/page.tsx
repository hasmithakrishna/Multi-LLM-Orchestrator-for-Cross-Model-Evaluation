"use client";

import { useState, useEffect } from "react";
import ChatPanel from "@/components/ChatPanel";
import PromptInput from "@/components/PromptInput";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type LLMState = {
  messages: Message[];
  loading: boolean;
  error: string | null;
};

const LLM_NAMES = ["llama", "qwen", "llama4"];

function createInitialState(): Record<string, LLMState> {
  return Object.fromEntries(
    LLM_NAMES.map((name) => [name, { messages: [], loading: false, error: null }])
  );
}

export default function Home() {
  const [sessionId, setSessionId] = useState("");
  const [llmStates, setLlmStates] = useState<Record<string, LLMState>>(createInitialState());

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
  }, []);

  function applyUserMessage(message: string) {
    setLlmStates((prev) => {
      const updated = { ...prev };
      LLM_NAMES.forEach((name) => {
        updated[name] = {
          ...updated[name],
          messages: [...updated[name].messages, { role: "user", content: message }],
          loading: true,
          error: null,
        };
      });
      return updated;
    });
  }

  function applyResult(llmName: string, response: string | null, error: string | null) {
    setLlmStates((prev) => ({
      ...prev,
      [llmName]: {
        messages: response
          ? [...prev[llmName].messages, { role: "assistant", content: response }]
          : prev[llmName].messages,
        loading: false,
        error: error,
      },
    }));
  }

  async function handleSend(message: string) {
    if (!sessionId) return;

    applyUserMessage(message);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, user_message: message }),
      });

      const data = await res.json();

      data.results.forEach((result: { llm: string; response: string | null; error: string | null }) => {
        applyResult(result.llm, result.response, result.error);
      });
    } catch {
      LLM_NAMES.forEach((name) => {
        setLlmStates((prev) => ({
          ...prev,
          [name]: { ...prev[name], loading: false, error: "Failed to reach backend." },
        }));
      });
    }
  }

  const isLoading = LLM_NAMES.some((name) => llmStates[name].loading);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-700 px-6 py-4 bg-gray-900">
        <h1 className="text-xl font-bold">Multi-LLM Orchestrator</h1>
        <p className="text-gray-400 text-sm mt-1">Ask once, get answers from three LLMs simultaneously</p>
      </header>

      <div className="flex-1 grid grid-cols-3 gap-4 p-4 overflow-hidden">
        {LLM_NAMES.map((name) => (
          <ChatPanel
            key={name}
            llmName={name}
            messages={llmStates[name].messages}
            loading={llmStates[name].loading}
            error={llmStates[name].error}
          />
        ))}
      </div>

      <PromptInput onSend={handleSend} loading={isLoading} />
    </div>
  );
}
