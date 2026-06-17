"use client";
import React, { useState } from "react";
import { Bell } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import NotificationItem from "./NotificationItem";
import type { AppNotification } from "@/lib/types";

interface AlertTrayProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  unreadCount: number;
}

export default function AlertTray({ notifications, onDismiss, unreadCount }: AlertTrayProps) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-gray-500 hover:text-gray-900"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/10 outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Upcoming Alerts</p>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/20 rounded-full px-1.5 py-0.5 font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                onClick={() => notifications.forEach((n) => onDismiss(n.id))}
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">No alerts</p>
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll be notified 15 &amp; 30 min before deadlines
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
                ))}
              </div>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
