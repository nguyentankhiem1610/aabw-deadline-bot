"use client";
import React from "react";
import { X, Bot, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { useChat } from "@/hooks/useChat";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function ChatPanel({ open, onClose }: ChatPanelProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } =
    useChat();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Slide-in panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-sm lg:max-w-none lg:w-96 z-40",
          "flex flex-col bg-white border-l border-gray-200 shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden shrink-0">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-white to-white" />
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-green-500/10 blur-2xl" />

          <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                <Bot className="h-5 w-5 text-white" />
                {/* Pulse dot */}
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-40" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white" />
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">AI Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500 hover:text-gray-900 px-2"
                  onClick={() => setMessages([])}
                >
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-7 w-7 text-gray-500 hover:text-gray-900"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ChatMessages messages={messages} isLoading={isLoading} />

        {/* Error */}
        {error && (
          <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-200 shrink-0">
            {error.message}
          </div>
        )}

        {/* Input */}
        <ChatInput
          input={input}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </aside>
    </>
  );
}
