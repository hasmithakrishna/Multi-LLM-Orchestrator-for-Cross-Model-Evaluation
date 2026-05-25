"use client";

import { useState, KeyboardEvent } from "react";

type Props = {
  onSend: (message: string) => void;
  loading: boolean;
};

export default function PromptInput({ onSend, loading }: Props) {
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-gray-700 bg-gray-900 p-4">
      <div className="flex gap-3 items-end max-w-6xl mx-auto">
        <textarea
          className="flex-1 bg-gray-800 text-gray-100 border border-gray-600 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-500 placeholder-gray-500"
          placeholder="Ask all three LLMs something... (Enter to send, Shift+Enter for new line)"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium px-5 py-3 rounded-xl text-sm transition-colors"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
