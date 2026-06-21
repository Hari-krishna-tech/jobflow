"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Job } from "@prisma/client";
import { JobStatus } from "@prisma/client";
import { JOB_STATUS_LABELS, JOB_STATUSES, type CreateJobInput } from "@/lib/schemas/job";
import { createJobAction, updateJobAction, parseJobDescriptionAction } from "@/lib/actions/job";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/*
 * JobForm — shared client component for Add (new) and Edit.
 *
 * CONTEXT/03 §4 "New Job (`/jobs/new`)":
 *   Centered form, max-width 640px.
 *   JD paste area + disabled "Extract with AI" button (post-MVP).
 *   Structured fields: company, position, location, salary, url,
 *   applied date, status, recruiter, notes.
 *   Footer: Cancel (secondary) + Save (primary).
 *
 * Uses `useActionState` for progressive-enhancement-friendly mutation.
 * On success: toast + navigate. Field errors render inline (CONTEXT/04 §4).
 */

type JobFormProps = {
  /** Existing job data for edit mode; omit for create mode. */
  job?: Job;
};

export function JobForm({ job }: JobFormProps) {
  const router = useRouter();
  const isEdit = !!job;

  // --- Controlled Form State ---
  const [formValues, setFormValues] = useState({
    company: job?.company ?? "",
    position: job?.position ?? "",
    location: job?.location ?? "",
    salary: job?.salary ?? "",
    jobUrl: job?.jobUrl ?? "",
    appliedDate: job?.appliedDate ? formatDate(job.appliedDate) : "",
    status: job?.status ?? JobStatus.APPLIED,
    recruiter: job?.recruiter ?? "",
    notes: job?.notes ?? "",
  });

  const [jdText, setJdText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleExtractAI = async () => {
    if (!jdText.trim()) {
      toast.error("Please paste a job description first.");
      return;
    }

    setIsExtracting(true);
    const result = await parseJobDescriptionAction(jdText);
    setIsExtracting(false);

    if (result.ok && result.data) {
      const data = result.data;
      setFormValues((prev) => ({
        ...prev,
        company: data.company || prev.company,
        position: data.position || prev.position,
        location: data.location || prev.location,
        salary: data.salary || prev.salary,
        notes: data.notes || prev.notes,
        recruiter: data.recruiter || prev.recruiter,
      }));
      toast.success("Job details extracted successfully!");
    } else {
      toast.error(result.message ?? "Extraction failed.");
    }
  };

  // --- Create action state ---
  const [createState, createDispatch, isCreating] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const raw = Object.fromEntries(formData.entries());
      const result = await createJobAction(raw as CreateJobInput);
      if (result.ok) {
        toast.success(result.message ?? "Application added.");
        router.push("/jobs");
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
      return result;
    },
    null,
  );

  // --- Edit action state ---
  const [editState, editDispatch, isUpdating] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      if (!job) return null;
      const raw = Object.fromEntries(formData.entries());
      const result = await updateJobAction(job.id, raw);
      if (result.ok) {
        toast.success(result.message ?? "Changes saved.");
        router.push("/jobs");
      } else {
        toast.error(result.message ?? "Something went wrong.");
      }
      return result;
    },
    null,
  );

  const actionState = isEdit ? editState : createState;
  const fieldErrors = actionState && !actionState.ok
    ? (actionState as { fieldErrors?: Record<string, string[]> }).fieldErrors
    : undefined;
  const isPending = isCreating || isUpdating;

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <form
        action={isEdit ? editDispatch : createDispatch}
        className="flex flex-col gap-5"
        noValidate
      >
        {/* JD paste area (enabled for Phase 5) */}
        {!isEdit && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="jd" className="text-text-dim">
              Paste job description
            </Label>
            <Textarea
              id="jd"
              placeholder="Paste the full job description here…"
              rows={4}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              disabled={isExtracting}
              className="resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-faint">
                {isExtracting ? "AI is analyzing description..." : "Extract structured fields automatically."}
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExtractAI}
                disabled={isExtracting || !jdText.trim()}
              >
                {isExtracting ? "Extracting..." : "Extract with AI"}
              </Button>
            </div>
          </div>
        )}

        {!isEdit && <hr className="border-border-soft" />}

        {/* Structured fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup
            name="company"
            label="Company"
            value={formValues.company}
            onChange={(e) => handleChange("company", e.target.value)}
            error={fieldErrors?.company}
            required
            placeholder="Acme Corp"
          />
          <FieldGroup
            name="position"
            label="Position"
            value={formValues.position}
            onChange={(e) => handleChange("position", e.target.value)}
            error={fieldErrors?.position}
            required
            placeholder="Senior Engineer"
          />
          <FieldGroup
            name="location"
            label="Location"
            value={formValues.location}
            onChange={(e) => handleChange("location", e.target.value)}
            error={fieldErrors?.location}
            placeholder="San Francisco, CA"
          />
          <FieldGroup
            name="salary"
            label="Salary"
            value={formValues.salary}
            onChange={(e) => handleChange("salary", e.target.value)}
            error={fieldErrors?.salary}
            placeholder="$180k"
          />
          <FieldGroup
            name="jobUrl"
            label="Job URL"
            type="url"
            value={formValues.jobUrl}
            onChange={(e) => handleChange("jobUrl", e.target.value)}
            error={fieldErrors?.jobUrl}
            placeholder="https://…"
            className="sm:col-span-2"
          />
          <DateGroup
            name="appliedDate"
            label="Applied Date"
            value={formValues.appliedDate}
            onChange={(e) => handleChange("appliedDate", e.target.value)}
            error={fieldErrors?.appliedDate}
          />
          <StatusGroup
            value={formValues.status}
            onChange={(val) => handleChange("status", val)}
            error={fieldErrors?.status}
          />
          <FieldGroup
            name="recruiter"
            label="Recruiter"
            value={formValues.recruiter}
            onChange={(e) => handleChange("recruiter", e.target.value)}
            error={fieldErrors?.recruiter}
            placeholder="Jane Doe"
          />
        </div>
        <FieldGroup
          name="notes"
          label="Notes"
          value={formValues.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          error={fieldErrors?.notes}
          placeholder="Anything worth remembering about this role…"
          textarea
          rows={3}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={() => router.push("/jobs")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save" : "Add Application"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ---- Inline field components ---- */

function FieldGroup({
  name,
  label,
  value,
  defaultValue,
  onChange,
  error,
  placeholder,
  type = "text",
  required = false,
  textarea = false,
  rows = 3,
  className,
}: {
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string[];
  placeholder?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  className?: string;
}) {
  const id = name;
  const Comp = textarea ? Textarea : Input;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-text-dim">
        {label}{required ? "" : null}
      </Label>
      <Comp
        id={id}
        name={name}
        type={type}
        value={value}
        defaultValue={value !== undefined ? undefined : defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error ? true : undefined}
        className={textarea ? "resize-none" : undefined}
        rows={textarea ? rows : undefined}
      />
      {error ? (
        <p className="text-xs text-red" role="alert">{error[0]}</p>
      ) : null}
    </div>
  );
}

function DateGroup({
  name,
  label,
  value,
  defaultValue,
  onChange,
  error,
}: {
  name: string;
  label: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name} className="text-text-dim">{label}</Label>
      <Input
        id={name}
        name={name}
        type="date"
        value={value}
        defaultValue={value !== undefined ? undefined : defaultValue}
        onChange={onChange}
        aria-invalid={!!error ? true : undefined}
        className="font-mono text-sm"
      />
      {error ? (
        <p className="text-xs text-red" role="alert">{error[0]}</p>
      ) : null}
    </div>
  );
}

function StatusGroup({
  value,
  defaultValue,
  onChange,
  error,
}: {
  value?: JobStatus;
  defaultValue?: JobStatus;
  onChange?: (value: JobStatus) => void;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-text-dim">Status</Label>
      <Select name="status" value={value} defaultValue={defaultValue} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {JOB_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-red" role="alert">{error[0]}</p>
      ) : null}
    </div>
  );
}
