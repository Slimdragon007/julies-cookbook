"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function formatMessage(text: string) {
  // Split into lines and process each
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
          <span className="text-warm shrink-0">&#8226;</span>
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
  // Handle **bold** markdown
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={i} className="font-semibold text-warm-dark">
          {boldMatch[1]}
        </strong>
      );
    }
    return part;
  });
}

const QUICK_PROMPTS = [
  "What's high protein and under 400 cal?",
  "What can I make in 30 minutes?",
  "Suggest something dairy-free",
  "Compare two recipes for me",
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });

      const data = await res.json();
      if (data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't respond right now. Try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-cream border border-border rounded-t-2xl w-full max-w-lg shadow-2xl flex flex-col" style={{ maxHeight: "70vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg text-warm-dark">Ask Julie&apos;s Assistant</h2>
          <button
            onClick={onClose}
            className="text-warm-light hover:text-warm-dark text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-warm-light text-sm font-body">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="bg-white border border-border text-warm text-xs px-3 py-1.5 rounded-full hover:bg-linen transition-colors font-body"
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
              className={`text-sm font-body ${
                msg.role === "user"
                  ? "text-warm-dark ml-8 text-right"
                  : "text-warm-dark/80 mr-8"
              }`}
            >
              <span
                className={`inline-block px-3 py-2 rounded-xl text-left ${
                  msg.role === "user"
                    ? "bg-warm text-white"
                    : "bg-white border border-border"
                }`}
              >
                {msg.role === "user" ? msg.content : formatMessage(msg.content)}
              </span>
            </div>
          ))}
          {loading && (
            <div className="text-sm text-warm-light font-body mr-8">
              <span className="inline-block px-3 py-2 rounded-xl bg-white border border-border">
                Thinking...
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
          className="px-5 py-3 border-t border-border flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recipes..."
            className="flex-1 bg-white border border-border rounded-full px-4 py-2 text-sm font-body text-warm-dark placeholder:text-warm-light/60 focus:outline-none focus:border-warm"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-warm text-white rounded-full px-4 py-2 text-sm font-body hover:bg-warm-dark disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
