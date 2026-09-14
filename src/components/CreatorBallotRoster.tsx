"use client";

import { FsmeetProfileTrigger } from "@/components/FsmeetProfileTrigger";
import { displayName } from "@/lib/capabilities";
import { formatCount, t } from "@/lib/i18n";

type RosterEntry = {
  voterUsername: string;
  isAbstention: boolean;
  optionLabels: string | null;
  updatedAt: string;
  voter?: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    type?: string;
  };
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function buildCsv(
  entries: RosterEntry[],
  abstentionLabel: string,
): string {
  const header = [
    "username",
    "first_name",
    "last_name",
    "answer",
    "updated_at",
  ];
  const rows = entries.map((entry) => [
    entry.voterUsername,
    entry.voter?.firstName ?? "",
    entry.voter?.lastName ?? "",
    entry.isAbstention ? abstentionLabel : entry.optionLabels || "",
    entry.updatedAt,
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");
}

export function CreatorBallotRoster({
  publicId,
  entries,
}: {
  publicId: string;
  entries: RosterEntry[];
}) {
  const messages = t();

  function downloadCsv() {
    const csv = buildCsv(entries, messages.poll.abstention);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `who-voted-${publicId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card p-5">
      <details className="group">
        <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            <span>
              <span className="display block text-2xl font-semibold">
                {messages.poll.ballotRosterTitle}
              </span>
              <span className="mt-1 block text-sm font-normal text-text-muted">
                {formatCount(messages.poll.ballotRosterSummary, {
                  count: entries.length,
                })}
              </span>
            </span>
            <span
              aria-hidden
              className="text-text-muted transition-transform duration-200 group-open:rotate-180"
            >
              ▾
            </span>
          </span>
        </summary>
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-text-muted">
              {messages.poll.ballotRosterHint}
            </p>
            <button
              type="button"
              className="btn btn-secondary text-sm"
              onClick={downloadCsv}
              disabled={entries.length === 0}
            >
              {messages.poll.ballotRosterDownloadCsv}
            </button>
          </div>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted">
              {messages.poll.ballotRosterEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <li
                  key={entry.voterUsername}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <FsmeetProfileTrigger
                    username={entry.voterUsername}
                    userType={entry.voter?.type}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.voter?.imageUrl || "/avatar-fallback.svg"}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="fsmeet-profile-name font-medium text-text">
                      {entry.voter
                        ? displayName(entry.voter)
                        : entry.voterUsername}
                    </span>
                  </FsmeetProfileTrigger>
                  <div className="sm:text-right">
                    <p className="text-sm text-text">
                      {entry.isAbstention
                        ? messages.poll.abstention
                        : entry.optionLabels || "—"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(entry.updatedAt).toLocaleString("en-GB")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}
