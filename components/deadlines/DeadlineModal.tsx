"use client";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Deadline, DeadlineCategory } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Time is required"),
  category: z.enum(["workshop", "submission", "food_perks", "team", "hackathon", "ceremony", "general"]),
  location: z.string().optional(),
  description: z.string().optional(),
  teamName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const CATEGORIES: { value: DeadlineCategory; label: string }[] = [
  { value: "team", label: "Team" },
  { value: "submission", label: "Submission" },
  { value: "workshop", label: "Workshop" },
  { value: "hackathon", label: "Hackathon" },
  { value: "ceremony", label: "Ceremony" },
  { value: "food_perks", label: "Food & Perks" },
  { value: "general", label: "General" },
];

interface DeadlineModalProps {
  open: boolean;
  deadline: Deadline | null;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_VALUES: FormValues = {
  title: "",
  date: new Date().toISOString().split("T")[0],
  time: "09:00",
  category: "team",
  location: "",
  description: "",
  teamName: "",
};

export default function DeadlineModal({ open, deadline, onClose, onSaved }: DeadlineModalProps) {
  const isEdit = Boolean(deadline);
  const [values, setValues] = useState<FormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (deadline) {
        setValues({
          title: deadline.title,
          date: deadline.date,
          time: deadline.time,
          category: deadline.category,
          location: deadline.location ?? "",
          description: deadline.description ?? "",
          teamName: deadline.teamName ?? "",
        });
      } else {
        setValues(DEFAULT_VALUES);
      }
      setErrors({});
    }
  }, [open, deadline]);

  const set = (key: keyof FormValues, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const errs: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/api/deadlines/${deadline!.id}` : "/api/deadlines";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Save failed");
      }
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-white border border-gray-200 shadow-2xl shadow-black/10">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{isEdit ? "Edit Deadline" : "Add Team Deadline"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Dry-run presentation"
            />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={values.date}
                onChange={(e) => set("date", e.target.value)}
              />
              {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={values.time}
                onChange={(e) => set("time", e.target.value)}
              />
              {errors.time && <p className="text-xs text-red-600">{errors.time}</p>}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={values.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={values.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Co-working Space"
            />
          </div>

          {/* Team Name */}
          <div className="space-y-1.5">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={values.teamName}
              onChange={(e) => set("teamName", e.target.value)}
              placeholder="e.g. Team Nexus"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 border-0 text-white">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Deadline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
