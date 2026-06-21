"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { createTaskAction } from "@/lib/actions/task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddTaskFormProps {
  jobId: string;
}

export function AddTaskForm({ jobId }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      const res = await createTaskAction({
        jobId,
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      if (res.ok) {
        toast.success("Task created.");
        setTitle("");
        setDueDate("");
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 pt-4 border-t border-border/30 mt-2"
    >
      <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-faint">
        Add Action Item
      </h4>
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Task title (e.g. Prep for technical interview)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          required
          className="h-9 text-sm"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isPending}
            className="h-9 text-sm font-mono flex-1 text-text-dim"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !title.trim()}
            className="h-9 gap-1.5 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Plus className="size-3.5" />
            )}
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}
