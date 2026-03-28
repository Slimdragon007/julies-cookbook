"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles } from "lucide-react";

interface Citation {
  url: string;
  title: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

function formatMessage(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const elements: React.ReactNode[] = [];

  let listItems: React.ReactNode[] = [];
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-1.5">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${i}`} className="flex gap-1.5">
          <span className="text-sky-400 shrink-0">&#8226;</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </li>
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className={i > 0 ? "mt-1.5" : ""}>
          {renderInline(line)}
        </p>
      );
    }
  });
  flushList();

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={i} className="font-bold text-slate-800">
          {boldMatch[1]}
        </strong>
      );
    }
    if (part.match(/^https?:\/\//)) {
      const display = part.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 underline hover:text-sky-700"
        >
          {display}
        </a>
      );
    }
    return part;
  });
}

const QUICK_PROMPTS = [
  "What's high protein and under 400 cal?",
  "What can I make in 30 minutes?",
  "Suggest something dairy-free",
  "Find me a new recipe online",
];

export default function ChatDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Thinking...");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const searchWords = ["find", "search", "look up", "new recipe", "online", "discover", "browse the web"];
    const isSearchQuery = searchWords.some((w) => text.toLowerCase().includes(w));
    setLoadingText(isSearchQuery ? "Searching the web..." : "Thinking...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response, citations: data.citations },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Couldn't connect right now. Check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/80 backdrop-blur-2xl border border-white/60 rounded-t-[2rem] w-full max-w-lg shadow-[0_-12px_48px_rgba(0,0,0,0.08)] flex flex-col" style={{ maxHeight: "70vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Ask Julie&apos;s Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="glass text-slate-600 text-xs px-4 py-2 rounded-full hover:bg-white/60 transition-colors font-bold"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === "user"
                  ? "ml-8 text-right"
                  : "mr-8"
              }`}
            >
              <span
                className={`inline-block px-4 py-3 rounded-2xl text-left font-medium ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white"
                    : "glass text-slate-700"
                }`}
              >
                {msg.role === "user" ? msg.content : formatMessage(msg.content)}
              </span>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Sources</p>
                  {msg.citations.map((cite, ci) => (
                    <a
                      key={ci}
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] text-sky-600 hover:text-sky-700 truncate font-medium"
                    >
                      {cite.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-sm mr-8">
              <span className="inline-block px-4 py-3 rounded-2xl glass text-slate-500 animate-pulse font-medium">
                {loadingText}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="px-6 py-4 border-t border-slate-100/50 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recipes..."
            className="flex-1 glass-input rounded-2xl px-5 py-3 text-sm text-slate-800 font-medium placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(0,166,244,0.25)] hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
