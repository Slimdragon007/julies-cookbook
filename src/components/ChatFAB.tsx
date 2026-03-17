"use client";

import { useState, useEffect } from "react";
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
        className={`fixed bottom-6 right-6 z-40 bg-warm hover:bg-warm-dark text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-105 ${
          pulse ? "animate-bounce" : ""
        }`}
        aria-label="Open chat assistant"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2C6.5 2 2 6 2 11c0 2.5 1 4.8 2.7 6.4L4 22l4.5-2.3c1.1.4 2.3.6 3.5.6 5.5 0 10-4 10-9S17.5 2 12 2z" />
        </svg>
      </button>
      <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
