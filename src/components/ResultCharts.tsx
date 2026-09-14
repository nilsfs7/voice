import { formatCount, t } from "@/lib/i18n";

type BarItem = { key: string; label: string; votes: number };

export function ResultCharts({
  showDetails,
  totalVotes,
  options,
  abstentions,
  byGender,
  byAge,
}: {
  showDetails: boolean;
  totalVotes: number;
  options: { id: number; label: string; votes: number }[];
  abstentions: number;
  byGender: BarItem[];
  byAge: BarItem[];
}) {
  const messages = t();

  return (
    <section className="card space-y-6 p-5">
      <div>
        <h2 className="display text-2xl font-semibold">
          {messages.poll.resultsTitle}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {formatCount(messages.poll.resultsTotalVotes, { count: totalVotes })}
        </p>
      </div>
      {!showDetails ? (
        <p className="text-sm text-text-muted">{messages.poll.resultsHidden}</p>
      ) : (
        <>
          <BarBlock
            title={messages.poll.answerShares}
            items={[
              ...options.map((o) => ({
                key: String(o.id),
                label: o.label,
                votes: o.votes,
              })),
              {
                key: "abstention",
                label: messages.poll.abstention,
                votes: abstentions,
              },
            ]}
            total={totalVotes}
          />
          <details className="group rounded-xl border border-border bg-bg/40">
            <summary className="cursor-pointer list-none px-4 py-3 font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                <span>{messages.poll.shareAnalytics}</span>
                <span
                  aria-hidden
                  className="text-text-muted transition-transform duration-200 group-open:rotate-180"
                >
                  ▾
                </span>
              </span>
            </summary>
            <div className="space-y-6 border-t border-border px-4 py-4">
              <BarBlock
                title={messages.poll.byGender}
                items={byGender}
                total={totalVotes}
              />
              <BarBlock
                title={messages.poll.byAge}
                items={byAge}
                total={totalVotes}
              />
            </div>
          </details>
        </>
      )}
    </section>
  );
}

function BarBlock({
  title,
  items,
  total,
}: {
  title: string;
  items: BarItem[];
  total: number;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.votes / total) * 100) : 0;
        return (
          <div key={item.key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-text-muted">
                {item.votes} · {pct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-accent transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
