type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  llmName: string;
  messages: Message[];
  loading: boolean;
  error: string | null;
};

const LLM_COLORS: Record<string, string> = {
  llama: "bg-blue-600",
  qwen: "bg-purple-600",
  llama4: "bg-green-600",
};

const LLM_LABELS: Record<string, string> = {
  llama: "Llama 3.3 70B",
  qwen: "Qwen 3 32B",
  llama4: "Llama 4 Scout",
};

export default function ChatPanel({ llmName, messages, loading, error }: Props) {
  return (
    <div className="flex flex-col h-full border border-gray-700 rounded-xl overflow-hidden bg-gray-900">
      <div className={`${LLM_COLORS[llmName]} px-4 py-3`}>
        <h2 className="text-white font-semibold text-sm">{LLM_LABELS[llmName]}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-100"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-start">
            <div className="bg-red-900 border border-red-700 rounded-lg px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
