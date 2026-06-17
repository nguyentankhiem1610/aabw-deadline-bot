"use client";
import React, { useState, useRef } from "react";
import { Upload, FileImage, Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn, getCategoryMeta, formatTime } from "@/lib/utils";
import type { ParsedCandidate } from "@/lib/types";

type Tab = "text" | "image";
type ParseState = "idle" | "parsing" | "preview" | "saving" | "done" | "error";

interface ParseUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ParseUploadModal({ open, onClose, onSaved }: ParseUploadModalProps) {
  const [tab, setTab] = useState<Tab>("text");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rawResponse, setRawResponse] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTab("text");
    setTextInput("");
    setImageFile(null);
    setImagePreview("");
    setParseState("idle");
    setCandidates([]);
    setSelected(new Set());
    setRawResponse("");
    setErrorMsg("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setErrorMsg("Image exceeds 10 MB limit. Please use a smaller image.");
      setParseState("error");
      return;
    }
    setImageFile(file);
    setErrorMsg("");
    setParseState("idle");
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    setParseState("parsing");
    setErrorMsg("");
    try {
      let body: object;
      if (tab === "text") {
        if (!textInput.trim()) {
          setErrorMsg("Please paste some schedule text first.");
          setParseState("idle");
          return;
        }
        body = { type: "text", content: textInput };
      } else {
        if (!imageFile || !imagePreview) {
          setErrorMsg("Please select an image file first.");
          setParseState("idle");
          return;
        }
        // Strip the data URL prefix to get base64
        const base64 = imagePreview.split(",")[1];
        body = { type: "image", content: base64, mimeType: imageFile.type };
      }

      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");

      if (!data.candidates?.length) {
        setRawResponse(data.rawResponse ?? "No events found.");
        setParseState("error");
        setErrorMsg(data.rawResponse ?? "No events could be extracted from the input.");
        return;
      }

      setCandidates(data.candidates);
      setRawResponse(data.rawResponse ?? "");
      setSelected(new Set(data.candidates.map((_: unknown, i: number) => i)));
      setParseState("preview");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
      setParseState("error");
    }
  };

  const toggleItem = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleConfirm = async () => {
    const toSave = candidates.filter((_, i) => selected.has(i));
    if (!toSave.length) { handleClose(); return; }

    setParseState("saving");
    try {
      for (const candidate of toSave) {
        const res = await fetch("/api/deadlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...candidate, type: "global" }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Save failed");
        }
      }
      setParseState("done");
      onSaved();
      setTimeout(handleClose, 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Save failed");
      setParseState("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg bg-white border border-gray-200 shadow-2xl shadow-black/10">
        <DialogHeader>
          <DialogTitle className="text-gray-900">AI Schedule Parser</DialogTitle>
          <DialogDescription>
            Paste schedule text or upload an image - the AI will extract events for you.
          </DialogDescription>
        </DialogHeader>

        {parseState === "done" ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <p className="text-green-600 font-medium">
              {selected.size} deadline{selected.size !== 1 ? "s" : ""} added!
            </p>
          </div>
        ) : (parseState === "preview" || parseState === "saving") ? (
          <div className="space-y-4">
            {rawResponse && (
              <p className="text-xs text-gray-500 italic">{rawResponse}</p>
            )}
            <p className="text-sm text-gray-700">
              Select the events to add ({selected.size}/{candidates.length} selected):
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {candidates.map((c, i) => {
                const meta = getCategoryMeta(c.category);
                const isSelected = selected.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleItem(i)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-all text-sm",
                      isSelected
                        ? "border-green-500/50 bg-green-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 truncate">{c.title}</span>
                      <span className={cn("text-xs shrink-0", meta.textColor)}>{meta.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      <span>{c.date}</span>
                      <span>{formatTime(c.time)}</span>
                      {c.location && <span className="truncate">{c.location}</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={selected.size === 0 || parseState === "saving"}>
                {parseState === "saving" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                ) : (
                  `Add ${selected.size} Deadline${selected.size !== 1 ? "s" : ""}`
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200 w-fit">
              {(["text", "image"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); setErrorMsg(""); setParseState("idle"); }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    tab === t
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {t === "text" ? "Paste Text" : "Upload Image"}
                </button>
              ))}
            </div>

            {tab === "text" ? (
              <div className="space-y-1.5">
                <Label>Schedule Text</Label>
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={"Paste raw schedule text here...\n\nExample:\n9:00 AM - Opening Ceremony (Main Hall)\n10:30 AM - AWS Workshop: Bedrock (Room A1)\n12:00 PM - Lunch"}
                  className="min-h-[160px]"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Schedule Image (JPEG, PNG, WebP · max 10 MB)</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
                    imageFile
                      ? "border-green-500/50 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  {imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="Preview" className="max-h-32 rounded object-contain" />
                  ) : (
                    <>
                      <FileImage className="h-10 w-10 text-gray-600" />
                      <p className="text-sm text-gray-500">Click to select image</p>
                    </>
                  )}
                  {imageFile && (
                    <p className="text-xs text-gray-500">{imageFile.name}</p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleParse} disabled={parseState === "parsing"}>
                {parseState === "parsing" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Parsing…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Parse with AI</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
