"use client";

import { FsmeetProfileTrigger } from "@/components/FsmeetProfileTrigger";
import { useI18n } from "@/components/I18nProvider";
import { displayName } from "@/lib/capabilities";
import {
  accountAgeSince,
  isAccountNewerThanPoll,
  parseJoined,
} from "@/lib/fsmeet/account-age";
import { formatCount, type Messages } from "@/lib/i18n/catalog";

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
    joined?: string | null;
  };
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function formatAccountAgeLabel(
  joined: Date,
  messages: Messages,
  now: Date,
): string {
  const age = accountAgeSince(joined, now);
  if (age.unit === "days") {
    if (age.count === 1) return messages.poll.ballotRosterAccountAgeDay;
    return formatCount(messages.poll.ballotRosterAccountAgeDays, {
      count: age.count,
    });
  }
  if (age.count === 1) return messages.poll.ballotRosterAccountAgeYear;
  return formatCount(messages.poll.ballotRosterAccountAgeYears, {
    count: age.count,
  });
}

function buildCsv(
  entries: RosterEntry[],
  abstentionLabel: string,
  pollCreatedAt: string,
): string {
  const pollCreated = parseJoined(pollCreatedAt);
  const header = [
    "username",
    "first_name",
    "last_name",
    "answer",
    "updated_at",
    "account_joined",
    "account_newer_than_poll",
  ];
  const rows = entries.map((entry) => {
    const joined = parseJoined(entry.voter?.joined);
    const newer =
      joined && pollCreated
        ? isAccountNewerThanPoll(joined, pollCreated)
          ? "yes"
          : "no"
        : "";
    return [
      entry.voterUsername,
      entry.voter?.firstName ?? "",
      entry.voter?.lastName ?? "",
      entry.isAbstention ? abstentionLabel : entry.optionLabels || "",
      entry.updatedAt,
      joined ? joined.toISOString() : "",
      newer,
    ];
  });
  return [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");
}

export function CreatorBallotRoster({
  publicId,
  pollCreatedAt,
  entries,
}: {
  publicId: string;
  /** Poll `created_at` ISO string — used to flag accounts newer than the poll. */
  pollCreatedAt: string;
  entries: RosterEntry[];
}) {
  const { messages, locale } = useI18n();
  const pollCreated = parseJoined(pollCreatedAt);
  const now = new Date();

  function downloadCsv() {
    const csv = buildCsv(entries, messages.poll.abstention, pollCreatedAt);
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
              {entries.map((entry) => {
                const joined = parseJoined(entry.voter?.joined);
                const newerThanPoll = Boolean(
                  joined &&
                    pollCreated &&
                    isAccountNewerThanPoll(joined, pollCreated),
                );
                const ageLabel = joined
                  ? formatAccountAgeLabel(joined, messages, now)
                  : null;

                return (
                  <li
                    key={entry.voterUsername}
                    className={`flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between${
                      newerThanPoll ? " roster-row-newer" : ""
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
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
                      {ageLabel ? (
                        <p
                          className={`text-xs ${
                            newerThanPoll
                              ? "font-medium text-danger"
                              : "text-text-muted"
                          }`}
                        >
                          {ageLabel}
                          {newerThanPoll
                            ? ` · ${messages.poll.ballotRosterAccountNewerThanPoll}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm text-text">
                        {entry.isAbstention
                          ? messages.poll.abstention
                          : entry.optionLabels || "—"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {new Date(entry.updatedAt).toLocaleString(locale)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}
