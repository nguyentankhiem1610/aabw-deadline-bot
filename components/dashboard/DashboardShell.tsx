"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Bot, Plus, Upload, Bell, Calendar, Zap, Clock, AlertTriangle,
  LayoutDashboard, Menu, X, ChevronRight, Sparkles, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterBar from "./FilterBar";
import TimelineView from "./TimelineView";
import DeadlineModal from "@/components/deadlines/DeadlineModal";
import ParseUploadModal from "@/components/deadlines/ParseUploadModal";
import ChatPanel from "@/components/chat/ChatPanel";
import AlertTray from "@/components/notifications/AlertTray";
import NotificationPoller from "@/components/notifications/NotificationPoller";
import { useDeadlines } from "@/hooks/useDeadlines";
import { useNotifications } from "@/hooks/useNotifications";
import { getNextDeadline, formatTimeRemaining, isDeadlinePast } from "@/lib/utils";
import type { Deadline, TimelineFilter } from "@/lib/types";

export default function DashboardShell() {
  const [filter, setFilter] = useState<TimelineFilter>("all");
  const [chatOpen, setChatOpen] = useState(false);
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const { deadlines, isLoading, mutate } = useDeadlines();
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredDeadlines = useMemo(() => {
    if (!deadlines) return [];
    if (filter === "global") return deadlines.filter((d) => d.type === "global");
    if (filter === "team") return deadlines.filter((d) => d.type === "team");
    return deadlines;
  }, [deadlines, filter]);

  // Stats derived purely from existing data — no new logic
  const stats = useMemo(() => {
    const all = deadlines ?? [];
    const upcoming = all.filter((d) => !isDeadlinePast(d.datetime));
    const nextDL = getNextDeadline(all);
    const teamCount = all.filter((d) => d.type === "team").length;
    return { upcoming: upcoming.length, total: all.length, next: nextDL, teamCount };
  }, [deadlines]);

  const handleEditDeadline = useCallback((deadline: Deadline) => {
    setEditingDeadline(deadline);
    setDeadlineModalOpen(true);
  }, []);

  const handleCloseDeadlineModal = useCallback(() => {
    setDeadlineModalOpen(false);
    setEditingDeadline(null);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const containerScroll = document.getElementById("scrollable-container")?.scrollTop || 0;
      setShowScrollTop(scrollY > 300 || containerScroll > 300);
    };

    window.addEventListener("scroll", handleScroll);
    const container = document.getElementById("scrollable-container");
    if (container) container.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (container) container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("scrollable-container")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* ── Notification Poller (invisible) ── */}
      <NotificationPoller deadlines={deadlines ?? []} onNotification={addNotification} />

      {/* ── SIDEBAR ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          bg-white border-r border-gray-200
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shrink-0">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">AABW 2026</p>
            <p className="text-[11px] text-gray-500 truncate">Deadline Tracker</p>
          </div>
          <button className="ml-auto lg:hidden text-gray-500 hover:text-gray-900" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {[
            { icon: LayoutDashboard, label: "Dashboard", active: true },
            // { icon: Calendar, label: "Schedule", active: false },
            // { icon: Zap, label: "Workshops", active: false },
            // { icon: AlertTriangle, label: "Cut-offs", active: false },
            // { icon: Clock, label: "Food & Perks", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                ? "bg-green-100 text-green-700 border border-green-200"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOP NAVBAR ── */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 px-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-900 mr-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">AABW 2026</span>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParseModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 h-8"
            >
              <Upload className="h-3.5 w-3.5" />
              Parse
            </Button>

            <Button
              size="sm"
              onClick={() => { setEditingDeadline(null); setDeadlineModalOpen(true); }}
              className="h-8 gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Deadline</span>
              <span className="sm:hidden">Add</span>
            </Button>

            <AlertTray notifications={notifications} onDismiss={dismissNotification} unreadCount={unreadCount} />
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <div
          id="scrollable-container"
          className={`flex-1 overflow-y-auto transition-all duration-300 ${chatOpen ? "lg:mr-[384px]" : ""}`}
          onScroll={(e) => setShowScrollTop(e.currentTarget.scrollTop > 300)}
        >

          {/* ── HERO BANNER ── */}
          <div className="relative overflow-hidden bg-gradient-to-r from-green-50 via-white to-green-50 border-b border-gray-200 px-6 py-8">
            {/* Background glow blobs */}
            <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-green-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 right-32 h-64 w-64 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />

            <div className="relative max-w-4xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                Your 5-Day Hackathon<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                  Command Center
                </span>
              </h1>
              <p className="mt-2 text-gray-600 text-sm max-w-md">
                Workshops, cut-offs, food windows, milestones - all in one place, always on time.
              </p>

              {/* Feature pills */}
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {[
                  { icon: Zap, label: "Powered by Groq", sub: "Ultra-fast LLM inference", color: "text-yellow-600" },
                  { icon: Bot, label: "AI Agent with Tools", sub: "Conversational + Actionable", color: "text-green-600" },
                  { icon: Upload, label: "Smart Schedule Parsing", sub: "From PDFs to perfect timelines", color: "text-emerald-600" },
                  { icon: Bell, label: "Real-time In-App Alerts", sub: "Never miss a critical moment", color: "text-orange-600" },
                ].map(({ icon: Icon, label, sub, color }) => (
                  <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm">
                    <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
                    <div>
                      <p className="text-gray-900 font-medium">{label}</p>
                      <p className="text-gray-600">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── STATS CARDS ── */}
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Day */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Day</p>
              <p className="text-3xl font-bold text-gray-900">
                {(() => {
                  const days = ["2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"];
                  const today = new Date().toISOString().split("T")[0];
                  const idx = days.indexOf(today);
                  return idx >= 0 ? idx + 1 : "—";
                })()}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">of 5</p>
            </div>

            {/* Upcoming */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
              <p className="text-xs text-gray-600 mt-0.5">Events</p>
            </div>

            {/* Next Cut-off */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Next Deadline</p>
              {stats.next ? (
                <>
                  <p className="text-2xl font-bold text-green-600 font-mono">
                    {formatTimeRemaining(stats.next.datetime).replace("in ", "")}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{stats.next.title}</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-gray-600">—</p>
              )}
            </div>

            {/* Total */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-600 mt-0.5">{stats.teamCount} team tasks</p>
            </div>
          </div>

          {/* ── WELCOME + FILTER + TIMELINE ── */}
          <div className="px-6 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Welcome back, Hacker! 👋</h2>
                <p className="text-xs text-gray-500">Here&apos;s what&apos;s happening at AABW 2026</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setParseModalOpen(true)}
                className="sm:hidden h-8 gap-1.5 text-xs text-gray-600"
              >
                <Upload className="h-3.5 w-3.5" />
                Parse
              </Button>
            </div>

            {/* Filter Bar */}
            <FilterBar
              filter={filter}
              onChange={setFilter}
              totalCounts={{
                all: deadlines?.length ?? 0,
                global: deadlines?.filter((d) => d.type === "global").length ?? 0,
                team: deadlines?.filter((d) => d.type === "team").length ?? 0,
              }}
            />

            {/* Timeline */}
            <div className="mt-5">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <TimelineView
                  deadlines={filteredDeadlines}
                  onEdit={handleEditDeadline}
                  onRefresh={mutate}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CHAT PANEL ── */}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── FLOATING BUTTONS ── */}
      <div className={`fixed bottom-6 z-30 flex flex-col gap-3 transition-all duration-300 ${chatOpen ? "right-6 lg:right-[408px]" : "right-6"}`}>
        {/* Scroll to top button */}
        {showScrollTop && (
          <Button
            size="icon"
            onClick={scrollToTop}
            className="h-12 w-12 rounded-full shadow-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
            title="Back to top"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}

        {/* AI Assistant Floating Button */}
        <Button
          size="icon"
          onClick={() => setChatOpen((v) => !v)}
          className={`h-12 w-12 rounded-full shadow-xl transition-all ${chatOpen
            ? "bg-green-600 hover:bg-green-700 text-white border-0"
            : "bg-white border border-gray-200 text-green-600 hover:bg-green-50"
            }`}
          title="AI Assistant"
        >
          <Bot className="h-5 w-5" />
        </Button>
      </div>

      {/* ── MODALS ── */}
      <DeadlineModal
        open={deadlineModalOpen}
        deadline={editingDeadline}
        onClose={handleCloseDeadlineModal}
        onSaved={mutate}
      />
      <ParseUploadModal
        open={parseModalOpen}
        onClose={() => setParseModalOpen(false)}
        onSaved={mutate}
      />
    </div>
  );
}
