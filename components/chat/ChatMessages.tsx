"use client";
import React, { useEffect, useRef } from "react";
import { Bot, Zap } from "lucide-react";
import ChatMessage from "./ChatMessage";
import type { Message } from "ai/react";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

const SUGGESTIONS = [
  "When is the next workshop?",
  "What are today's cut-offs?",
  "Where is the Google workshop?",
  "Add a team deadline for dry-run at 9 PM",
];

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 overflow-y-auto">

        <div className="text-center">
          <p className="text-xs text-gray-500 mt-1">Ask anything about the event,<br />get instant answers.</p>
        </div>

        {/* Suggestion chips */}
        <div className="w-full max-w-xs space-y-2">
          {SUGGESTIONS.map((s) => (
            <div
              key={s}
              className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700 text-center cursor-default hover:bg-gray-100 transition-colors"
            >
              &ldquo;{s}&rdquo;
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex gap-2 items-start">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shrink-0 mt-0.5">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-gray-100 border border-gray-200 px-4 py-3">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
