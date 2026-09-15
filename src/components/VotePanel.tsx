"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t } from "@/lib/i18n";

type Option = { id: number; label: string; description: string | null };

type AgeGate =
  | { ok: true }
  | { ok: false; reason: string; missing: string[] };

export function VotePanel({
  publicId,
  choiceMode,
  options,
  canVoteNow,
  initial,
  loggedIn,
  ageGate,
}: {
  publicId: string;
  choiceMode: "single" | "multiple";
  options: Option[];
  canVoteNow: boolean;
  initial: { isAbstention: boolean; optionIds: number[] } | null;
  loggedIn: boolean;
  ageGate?: AgeGate;
}) {
  const messages = t();
  const router = useRouter();
  const [isAbstention, setIsAbstention] = useState(
    initial?.isAbstention ?? false,
  );
  const [selected, setSelected] = useState<number[]>(initial?.optionIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    setError(null);
    setMissing([]);
    setOk(false);
    const res = await fetch(`/api/polls/${publicId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isAbstention,
        optionIds: isAbstention ? [] : selected,
      }),
    });
    setPending(false);
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      missing?: string[];
    };
    if (!res.ok) {
      if (data.error === "profile_presence") {
        setError(messages.poll.missingProfileVote);
      } else if (data.error === "missing_fields") {
        setMissing(data.missing ?? []);
        setError(
          messages.poll.missingProfile.replace(
            "{fields}",
            (data.missing ?? []).join(", "),
          ),
        );
      } else if (data.error === "ineligible") {
        setError(messages.poll.ineligible);
      } else if (data.error === "poll_closed") {
        setError(messages.poll.closed);
      } else if (data.error === "unauthorized") {
        setError(messages.poll.loginToInteract);
      } else {
        setError(data.error || "Vote failed");
      }
      return;
    }
    setOk(true);
    router.refresh();
  }

  if (!loggedIn) {
    return (
      <div className="card space-y-3 p-5">
        <p className="text-sm text-text-muted">{messages.poll.loginToInteract}</p>
        <a
          className="btn btn-primary"
          href={`/api/auth/fsmeet/start?returnTo=/polls/${publicId}`}
        >
          Log in
        </a>
      </div>
    );
  }

  if (ageGate && !ageGate.ok) {
    return (
      <div className="card space-y-3 p-5">
        <p className="text-sm text-danger">
          {ageGate.reason === "profile_presence"
            ? messages.poll.missingProfileVote
            : ageGate.reason === "missing_fields"
              ? messages.poll.missingProfile.replace(
                  "{fields}",
                  ageGate.missing.join(", "),
                )
              : messages.poll.ineligible}
        </p>
        {ageGate.reason === "missing_fields" ||
        ageGate.reason === "profile_presence" ? (
          <a
            className="btn btn-secondary"
            href="https://fsmeet.com/account"
            target="_blank"
            rel="noreferrer"
          >
            {messages.poll.updateProfile}
          </a>
        ) : null}
      </div>
    );
  }

  if (!canVoteNow) {
    return (
      <div className="card p-5 text-sm text-text-muted">
        Voting is not available right now.
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="space-y-3">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 ${
                isAbstention
                  ? "opacity-40"
                  : checked
                    ? "border-accent bg-accent-subtle"
                    : "border-border"
              }`}
            >
              <input
                type={choiceMode === "single" ? "radio" : "checkbox"}
                name="option"
                disabled={isAbstention}
                checked={checked}
                onChange={() => {
                  if (choiceMode === "single") {
                    setSelected([option.id]);
                    setIsAbstention(false);
                  } else {
                    setSelected((prev) =>
                      checked
                        ? prev.filter((id) => id !== option.id)
                        : [...prev, option.id],
                    );
                    setIsAbstention(false);
                  }
                }}
              />
              <span>
                <span className="font-medium">{option.label}</span>
                {option.description ? (
                  <span className="mt-1 block text-sm text-text-muted">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <label
        className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 ${
          isAbstention ? "border-accent bg-accent-subtle" : "border-border"
        }`}
      >
        <input
          type="checkbox"
          checked={isAbstention}
          onChange={(e) => {
            setIsAbstention(e.target.checked);
            if (e.target.checked) setSelected([]);
          }}
        />
        <span>
          <span className="font-medium">{messages.poll.abstention}</span>
          <span className="mt-1 block text-sm text-text-muted">
            {messages.poll.abstentionHint}
          </span>
        </span>
      </label>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {missing.length ? (
        <a
          className="btn btn-secondary"
          href="https://fsmeet.com/account"
          target="_blank"
          rel="noreferrer"
        >
          {messages.poll.updateProfile}
        </a>
      ) : null}
      {ok ? (
        <p className="text-sm font-medium text-accent">
          {messages.poll.voteRecorded}
        </p>
      ) : null}

      <button className="btn btn-primary" disabled={pending} onClick={submit}>
        {initial ? messages.poll.updateVote : messages.poll.submitVote}
      </button>
    </div>
  );
}
