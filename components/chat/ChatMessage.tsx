"use client";
import React from "react";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "ai/react";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-xl shrink-0",
          isUser
            ? "bg-gray-200"
            : "bg-gradient-to-br from-green-500 to-emerald-600"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-gray-600" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-green-600 text-white shadow-lg shadow-green-600/20"
            : "rounded-bl-sm bg-gray-100 border border-gray-200 text-gray-900"
        )}
      >
        {message.content.split("\n").map((line, i, arr) => (
          <React.Fragment key={i}>
            {line}
            {i < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
