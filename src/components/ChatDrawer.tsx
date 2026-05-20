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
        </ul>,
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^[\s]*[•\-\*]\s+(.+)/);
    if (bulletMatch) {
      listItems.push(
        <li key={`li-${i}`} className="flex gap-1.5">
          <span className="text-accent shrink-0">&#8226;</span>
          <span>{renderInline(bulletMatch[1])}</span>
        </li>,
      );
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} className={i > 0 ? "mt-1.5" : ""}>
          {renderInline(line)}
        </p>,
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
        <strong key={i} className="font-semibold text-ink">
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
          className="text-accent underline hover:text-accent-ink"
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
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLastFailedMessage(null);
    setLoading(true);

    const searchWords = [
      "find",
      "search",
      "look up",
      "new recipe",
      "online",
      "discover",
      "browse the web",
    ];
    const isSearchQuery = searchWords.some((w) =>
      text.toLowerCase().includes(w),
    );
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
          {
            role: "assistant",
            content: data.response,
            citations: data.citations,
          },
        ]);
      }
    } catch {
      setLastFailedMessage(text);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Couldn't connect right now. Check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-ink/10 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close Kitchen line"
      />
      <div
        className="relative bg-paper/95 backdrop-blur-2xl border border-rule rounded-t-[2rem] w-full max-w-lg shadow-[0_-12px_48px_rgba(20,19,15,0.08)] flex flex-col"
        style={{ maxHeight: "70vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-rule">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-on" />
            </div>
            <h2 className="font-display text-[22px] text-ink leading-none">
              Kitchen line
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Kitchen line"
            className="w-11 h-11 rounded-full bg-card border border-rule hover:bg-accent-soft hover:text-accent-ink flex items-center justify-center text-ink-soft transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-ink-mute font-sans text-sm font-medium">
                Try asking:
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="bg-card border border-rule text-ink-soft font-sans font-medium text-xs px-4 py-2 rounded-full hover:bg-accent-soft hover:text-accent-ink hover:border-accent-soft transition-colors"
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
              className={`text-sm ${msg.role === "user" ? "ml-8 text-right" : "mr-8"}`}
            >
              <span
                className={`inline-block px-4 py-3 rounded-2xl text-left font-sans font-medium ${
                  msg.role === "user"
                    ? "bg-accent text-accent-on"
                    : "bg-card border border-rule text-ink"
                }`}
              >
                {msg.role === "user" ? msg.content : formatMessage(msg.content)}
              </span>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  <p className="font-sans text-[10px] text-ink-mute uppercase tracking-wide font-semibold">
                    Sources
                  </p>
                  {msg.citations.map((cite, ci) => (
                    <a
                      key={ci}
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-[11px] text-accent hover:text-accent-ink truncate font-sans font-medium"
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
              <span className="inline-block px-4 py-3 rounded-2xl bg-card border border-rule text-ink-soft font-sans font-medium animate-pulse">
                {loadingText}
              </span>
            </div>
          )}
          {lastFailedMessage && !loading && (
            <div className="flex justify-center">
              <button
                onClick={() => sendMessage(lastFailedMessage)}
                className="font-sans text-xs font-semibold text-accent-ink bg-accent-soft px-4 py-2 rounded-full hover:bg-accent hover:text-accent-on active:scale-95 transition-all"
              >
                Retry last message
              </button>
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
          className="px-6 py-4 border-t border-rule flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              loading ? "Waiting for response..." : "Ask about recipes..."
            }
            disabled={loading}
            className="flex-1 bg-card border border-rule rounded-2xl px-5 py-3 font-sans text-sm text-ink placeholder:text-ink-mute outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-accent text-accent-on rounded-2xl flex items-center justify-center disabled:opacity-50 transition-all shadow-[0_4px_16px_rgba(217,119,87,0.25)] hover:bg-accent-ink hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
