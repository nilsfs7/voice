"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Select } from "@/components/Select";
import { t } from "@/lib/i18n";

type OptionDraft = { label: string; description: string };

export function PollForm({
  mode,
  publicId,
  initial,
  defaultMinAge,
}: {
  mode: "create" | "edit";
  publicId?: string;
  defaultMinAge: number;
  initial?: {
    question: string;
    description: string;
    alias: string;
    choiceMode: "single" | "multiple";
    liveResultShares: boolean;
    countryCode: string;
    continentalCode: string;
    minAge: string;
    maxAge: string;
    gender: "" | "male" | "female";
    startAt: string;
    endAt: string;
    options: OptionDraft[];
  };
}) {
  const messages = t();
  const router = useRouter();
  const defaults = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      question: "",
      description: "",
      alias: "",
      choiceMode: "single" as const,
      liveResultShares: false,
      countryCode: "",
      continentalCode: "",
      minAge: String(defaultMinAge),
      maxAge: "",
      gender: "" as const,
      startAt: toLocalInput(now),
      endAt: toLocalInput(end),
      options: [
        { label: "", description: "" },
        { label: "", description: "" },
      ],
    };
  }, [defaultMinAge]);

  const [form, setForm] = useState(initial ?? defaults);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const payload = {
      question: form.question,
      description: form.description || null,
      alias: form.alias || null,
      choiceMode: form.choiceMode,
      liveResultShares: form.liveResultShares,
      countryCode: form.countryCode || null,
      continentalCode: form.continentalCode || null,
      minAge: form.minAge ? Number(form.minAge) : null,
      maxAge: form.maxAge ? Number(form.maxAge) : null,
      gender: form.gender || null,
      startAt: new Date(form.startAt).toISOString(),
      endAt: new Date(form.endAt).toISOString(),
      options: form.options.filter((o) => o.label.trim()),
    };

    const res = await fetch(
      mode === "create" ? "/api/polls" : `/api/polls/${publicId}`,
      {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (data.error === "alias_taken") {
        setError("This URL alias is already taken.");
      } else if (data.error === "invalid_alias") {
        setError("Alias must be 3–64 characters: letters, numbers, hyphens.");
      } else {
        setError("Could not save the poll. Check required fields.");
      }
      return;
    }
    const data = (await res.json()) as {
      publicId?: string;
      alias?: string | null;
      path?: string;
    };
    router.push(data.path ?? `/polls/${data.publicId ?? publicId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-6 p-6">
      <label className="block space-y-1 text-sm">
        <span>{messages.form.question}</span>
        <input
          className="field"
          required
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>{messages.form.description}</span>
        <textarea
          className="field min-h-24"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>{messages.form.alias}</span>
        <input
          className="field"
          value={form.alias}
          placeholder="world-cup-rules"
          onChange={(e) => setForm({ ...form, alias: e.target.value })}
        />
        <span className="muted text-xs">{messages.form.aliasHint}</span>
      </label>

      <fieldset className="space-y-2 text-sm">
        <legend>{messages.form.choiceMode}</legend>
        <label className="mr-4 inline-flex items-center gap-2">
          <input
            type="radio"
            checked={form.choiceMode === "single"}
            onChange={() => setForm({ ...form, choiceMode: "single" })}
          />
          Single
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            checked={form.choiceMode === "multiple"}
            onChange={() => setForm({ ...form, choiceMode: "multiple" })}
          />
          Multiple
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{messages.form.startAt}</span>
          <input
            className="field"
            type="datetime-local"
            required
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{messages.form.endAt}</span>
          <input
            className="field"
            type="datetime-local"
            required
            value={form.endAt}
            onChange={(e) => setForm({ ...form, endAt: e.target.value })}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.liveResultShares}
          onChange={(e) =>
            setForm({ ...form, liveResultShares: e.target.checked })
          }
        />
        {messages.form.liveShares}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{messages.form.countryCode}</span>
          <input
            className="field"
            value={form.countryCode}
            onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{messages.form.continentalCode}</span>
          <input
            className="field"
            value={form.continentalCode}
            onChange={(e) =>
              setForm({ ...form, continentalCode: e.target.value })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{messages.form.minAge}</span>
          <input
            className="field"
            type="number"
            value={form.minAge}
            onChange={(e) => setForm({ ...form, minAge: e.target.value })}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{messages.form.maxAge}</span>
          <input
            className="field"
            type="number"
            value={form.maxAge}
            onChange={(e) => setForm({ ...form, maxAge: e.target.value })}
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>{messages.form.gender}</span>
        <Select
          aria-label={messages.form.gender}
          value={form.gender}
          onChange={(gender) =>
            setForm({
              ...form,
              gender: gender as "" | "male" | "female",
            })
          }
          options={[
            { value: "", label: "None" },
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </label>

      <div className="space-y-3">
        <div className="font-medium">{messages.form.options}</div>
        {form.options.map((option, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-border p-3">
            <input
              className="field"
              required={index < 2}
              placeholder={`${messages.form.optionLabel} ${index + 1}`}
              value={option.label}
              onChange={(e) => {
                const options = [...form.options];
                options[index] = { ...option, label: e.target.value };
                setForm({ ...form, options });
              }}
            />
            <textarea
              className="field min-h-16"
              placeholder={messages.form.optionDescription}
              value={option.description}
              onChange={(e) => {
                const options = [...form.options];
                options[index] = { ...option, description: e.target.value };
                setForm({ ...form, options });
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            setForm({
              ...form,
              options: [...form.options, { label: "", description: "" }],
            })
          }
        >
          {messages.form.addOption}
        </button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button className="btn btn-primary" disabled={pending} type="submit">
        {mode === "create" ? messages.form.create : messages.form.saveDraft}
      </button>
    </form>
  );
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
