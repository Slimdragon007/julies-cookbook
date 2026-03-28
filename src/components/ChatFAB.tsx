"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import ChatDrawer from "./ChatDrawer";

export default function ChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPulse(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <button
        data-chat-fab
        onClick={() => {
          setIsOpen(true);
          setPulse(false);
        }}
        className={`fixed bottom-28 lg:bottom-6 right-6 z-40 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-[0_8px_24px_rgba(196,149,46,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_32px_rgba(196,149,46,0.4)] active:scale-95 ${
          pulse ? "animate-bounce" : ""
        }`}
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
