type Message = {
  role: "user" | "assistant";
  content: string;
};

type Metrics = {
  latency: number;
  duration: number;
  tokens: number;
};

type ToolEvent = {
  name: string;
  args: Record<string, unknown>;
  result: string;
};

type Props = {
  llmName: string;
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  metrics: Metrics | null;
  toolEvents: ToolEvent[];
  error: string | null;
};

const LLM_CONFIG: Record<string, { label: string; model: string; color: string; colorDim: string }> = {
  llama: {
    label: "LLaMA 3.3",
    model: "70B · Meta",
    color: "#818cf8",
    colorDim: "rgba(129,140,248,0.12)",
  },
  qwen: {
    label: "Qwen 3",
    model: "32B · Alibaba",
    color: "#fb923c",
    colorDim: "rgba(251,146,60,0.12)",
  },
  gpt: {
    label: "GPT OSS",
    model: "120B · OpenAI",
    color: "#34d399",
    colorDim: "rgba(52,211,153,0.12)",
  },
};

function cleanContent(content: string): string {
  return content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function fmt(ms: number) {
  return (ms / 1000).toFixed(2) + "s";
}

export default function ChatPanel({ llmName, messages, loading, streaming, metrics, toolEvents, error }: Props) {
  const cfg = LLM_CONFIG[llmName];
  const tokPerSec = metrics ? Math.round(metrics.tokens / (metrics.duration / 1000)) : null;

  return (
    <div
      className="flex flex-col h-full rounded-2xl overflow-hidden"
      style={{
        background: "#0f0f1a",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 8px 32px rgba(0,0,0,0.4)",
        borderTop: `2px solid ${cfg.color}`,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
          />
          <div>
            <p className="text-white font-semibold text-sm leading-none">{cfg.label}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{cfg.model}</p>
          </div>
        </div>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ background: cfg.colorDim, color: cfg.color }}
        >
          {loading ? (streaming ? "streaming" : "thinking") : "ready"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: cfg.colorDim }}
            >
              <span className="text-lg" style={{ color: cfg.color }}>✦</span>
            </div>
            <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              {cfg.label} is ready
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLast = i === messages.length - 1;
          const isStreamingThis = isLast && msg.role === "assistant" && streaming;
          const cleaned = msg.role === "assistant" ? cleanContent(msg.content) : msg.content;

          return (
            <div key={i} className={`flex msg-appear ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div
                  className="max-w-[82%] rounded-2xl rounded-tr-sm px-4 py-3 text-base leading-relaxed font-semibold"
                  style={{
                    background: `${cfg.color}28`,
                    border: `1px solid ${cfg.color}88`,
                    color: "white",
                    boxShadow: `0 0 20px ${cfg.color}33, inset 0 0 20px ${cfg.color}08`,
                  }}
                >
                  {cleaned}
                </div>
              ) : (
                <div
                  className="max-w-[92%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    background: "#161624",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.82)",
                  }}
                >
                  {cleaned}
                  {isStreamingThis && (
                    <span className="cursor-blink" style={{ color: cfg.color }} />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {toolEvents.map((te, i) => (
          <div key={i} className="msg-appear rounded-xl px-4 py-3" style={{ background: "#0e0e1c", border: `1px solid ${cfg.color}33` }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold" style={{ color: cfg.color }}>⚙ Tool called</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md" style={{ background: `${cfg.color}18`, color: cfg.color }}>{te.name}</span>
            </div>
            {Object.entries(te.args ?? {}).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs mb-1">
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{k}:</span>
                <span className="font-mono" style={{ color: "rgba(255,255,255,0.65)" }}>{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Result:</span>
              <span className="text-xs font-mono font-bold" style={{ color: cfg.color }}>{te.result}</span>
            </div>
          </div>
        ))}

        {loading && !streaming && (
          <div className="flex justify-start msg-appear">
            <div
              className="rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center"
              style={{ background: "#161624", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="dot w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="dot w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="dot w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Metrics bar */}
      {metrics && (
        <div
          className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0c0c16" }}
        >
          <MetricChip label="1st token" value={fmt(metrics.latency)} color={cfg.color} />
          <MetricChip label="Total" value={fmt(metrics.duration)} color={cfg.color} />
          <MetricChip label="Tokens" value={String(metrics.tokens)} color={cfg.color} />
          <MetricChip label="Speed" value={`${tokPerSec}/s`} color={cfg.color} />
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center flex-1">
      <span className="text-xs font-semibold" style={{ color }}>{value}</span>
      <span className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
    </div>
  );
}
