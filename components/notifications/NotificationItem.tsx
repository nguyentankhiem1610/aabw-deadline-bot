"use client";
import React from "react";
import { X, Clock } from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

interface NotificationItemProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

export default function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const isUrgent = notification.proximityWindow === 15;

  return (
    <div className="flex items-start gap-3 rounded-xl p-3 bg-gray-50 border border-gray-200 group hover:border-gray-300 transition-colors">
      {/* Icon */}
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
          isUrgent ? "bg-red-500/15" : "bg-orange-500/15"
        }`}
      >
        <Clock className={`h-4 w-4 ${isUrgent ? "text-red-400" : "text-orange-400"}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-snug truncate">
          {notification.deadlineTitle}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 ${
              isUrgent
                ? "bg-red-500/15 text-red-400"
                : "bg-orange-500/15 text-orange-400"
            }`}
          >
            {notification.proximityWindow} min
          </span>
          <span className="text-xs text-gray-600">
            {formatTimeRemaining(notification.deadlineDatetime)}
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(notification.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-900 shrink-0 mt-0.5"
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
