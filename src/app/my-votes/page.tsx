import Link from "next/link";
import { redirect } from "next/navigation";
import { readSessionUser } from "@/lib/auth/session";
import { getMessages } from "@/lib/i18n";
import { pollHref } from "@/lib/polls/alias";
import { listBallotsForUser } from "@/lib/polls/ballots";

export const dynamic = "force-dynamic";

export default async function MyVotesPage() {
  const user = await readSessionUser();
  if (!user) redirect("/api/auth/fsmeet/start?returnTo=/my-votes");
  const messages = await getMessages();

  let rows: Awaited<ReturnType<typeof listBallotsForUser>> = [];
  try {
    rows = await listBallotsForUser(user.username);
  } catch {
    return (
      <div className="card p-6 text-sm text-text-muted">
        Database unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="display text-4xl font-semibold">{messages.myVotes.title}</h1>
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-text-muted">
          {messages.myVotes.empty}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Link
              key={row.public_id}
              href={pollHref(row)}
              className="card block space-y-2 px-5 py-4 hover:-translate-y-0.5 transition"
            >
              <h2 className="display text-xl font-semibold">{row.question}</h2>
              <p className="text-sm text-text-muted">
                {messages.myVotes.answer}:{" "}
                {row.is_abstention
                  ? messages.poll.abstention
                  : row.option_labels || "—"}
              </p>
              <p className="text-xs text-text-muted">
                Ends {new Date(row.end_at).toLocaleString("en-GB")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
