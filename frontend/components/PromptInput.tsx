"use client";

import { useState, KeyboardEvent } from "react";

type Props = {
  onSend: (message: string) => void;
  loading: boolean;
};

const TEMPLATES = [
  {
    emoji: "⚡",
    label: "Explain Simply",
    desc: "Quantum entanglement for a 10 year old",
    prompt: "Explain quantum entanglement to a 10 year old.",
  },
  {
    emoji: "🐍",
    label: "Write Code",
    desc: "Prime numbers using Sieve of Eratosthenes",
    prompt: "Write a Python function to find all prime numbers up to N using the Sieve of Eratosthenes.",
  },
  {
    emoji: "🧠",
    label: "Logical Reasoning",
    desc: "Bat & ball problem — show your work",
    prompt: "A bat and ball cost $1.10 total. The bat costs $1 more than the ball. How much does the ball cost? Show your reasoning step by step.",
  },
  {
    emoji: "🔧",
    label: "Math Tool",
    desc: "Calculator tool: sqrt(1764) × 12",
    prompt: "What is the square root of 1764 multiplied by 12?",
  },
  {
    emoji: "📅",
    label: "Date Tool",
    desc: "Ask what today's date and day is",
    prompt: "What is today's date and what day of the week is it?",
  },
  {
    emoji: "⚖️",
    label: "Pros & Cons",
    desc: "Balanced analysis of remote work",
    prompt: "What are the pros and cons of remote work? Give a balanced analysis.",
  },
  {
    emoji: "🆚",
    label: "Compare Tech",
    desc: "SQL vs NoSQL — when to use each",
    prompt: "Compare SQL and NoSQL databases. When should you use each?",
  },
  {
    emoji: "✍️",
    label: "Creative Writing",
    desc: "Sci-fi story opening on a dying star",
    prompt: "Write the opening paragraph of a sci-fi story set on a dying star.",
  },
];

export default function PromptInput({ onSend, loading }: Props) {
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
    setSelected(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function pickTemplate(t: typeof TEMPLATES[0]) {
    setInput(t.prompt);
    setSelected(t.label);
  }

  const canSend = !!input.trim() && !loading;

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center px-6 pt-4 pb-4 gap-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0b0b14" }}
    >
      {/* Template cards */}
      <div className="w-full max-w-3xl grid grid-cols-4 gap-2">
        {TEMPLATES.map((t) => {
          const isActive = selected === t.label;
          return (
            <button
              key={t.label}
              disabled={loading}
              onClick={() => pickTemplate(t)}
              className="text-left rounded-xl px-3 py-2.5 transition-all"
              style={{
                background: isActive ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.03)",
                border: isActive ? "1px solid rgba(129,140,248,0.45)" : "1px solid rgba(255,255,255,0.07)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base leading-none">{t.emoji}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: isActive ? "#818cf8" : "rgba(255,255,255,0.75)" }}
                >
                  {t.label}
                </span>
              </div>
              <p className="text-xs leading-snug" style={{ color: "rgba(255,255,255,0.3)" }}>
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Input box */}
      <div className="w-full max-w-xl">
        <div
          className="relative rounded-2xl"
          style={{
            background: "#13131f",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 24px rgba(99,102,241,0.06)",
          }}
        >
          <textarea
            className="w-full bg-transparent resize-none focus:outline-none leading-relaxed px-5 pt-4 pb-14"
            style={{ color: "rgba(255,255,255,0.92)", fontSize: "1.05rem", caretColor: "#818cf8" }}
            placeholder="Ask all three models something…"
            rows={3}
            value={input}
            onChange={(e) => { setInput(e.target.value); setSelected(null); }}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
              Shift+Enter for new line
            </span>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: canSend ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(255,255,255,0.05)",
                color: canSend ? "white" : "rgba(255,255,255,0.2)",
                boxShadow: canSend ? "0 4px 16px rgba(99,102,241,0.4)" : "none",
                cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin inline-block" />
                  Running
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
