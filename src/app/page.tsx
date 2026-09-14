import Link from "next/link";
import { FsmeetProfileTrigger } from "@/components/FsmeetProfileTrigger";
import { HomeFilters } from "@/components/HomeFilters";
import { displayName } from "@/lib/capabilities";
import { fetchFsmeetUsers } from "@/lib/fsmeet/users";
import { formatCount, t } from "@/lib/i18n";
import { readSessionUser } from "@/lib/auth/session";
import { pollHref } from "@/lib/polls/alias";
import { formatPollCardRemaining } from "@/lib/polls/remaining";
import { listPollCreatorUsernames, listPolls } from "@/lib/polls/repository";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  sort?: string;
  creator?: string;
  creatorType?: string;
  authError?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const messages = t();
  const user = await readSessionUser();
  const sort =
    params.sort === "end_at" || params.sort === "score"
      ? params.sort
      : "created_at";
  const creatorType =
    params.creatorType === "association" ? "association" : "all";

  let polls: Awaited<ReturnType<typeof listPolls>> = [];
  let creatorUsernames: string[] = [];
  let dbError = false;
  try {
    [polls, creatorUsernames] = await Promise.all([
      listPolls({
        sort,
        creator: params.creator || null,
        viewerUsername: user?.username,
      }),
      listPollCreatorUsernames({ viewerUsername: user?.username }),
    ]);
  } catch {
    dbError = true;
  }

  const creators = await fetchFsmeetUsers([
    ...polls.map((p) => p.creator_username),
    ...creatorUsernames,
  ]);

  if (creatorType === "association") {
    polls = polls.filter(
      (poll) => creators.get(poll.creator_username)?.type === "association",
    );
  }

  const creatorOptions = creatorUsernames.map((username) => {
    const profile = creators.get(username);
    return {
      value: username,
      label: profile
        ? `${displayName(profile)} (@${username})`
        : `@${username}`,
    };
  });

  return (
    <div className="space-y-10">
      <section className="max-w-2xl space-y-4">
        <p className="text-sm font-medium tracking-wide text-accent uppercase">
          {messages.app.name}
        </p>
        <h1 className="display text-4xl leading-tight font-semibold sm:text-5xl">
          {messages.home.title}
        </h1>
        <p className="text-lg text-text-muted">{messages.home.subtitle}</p>
      </section>

      {params.authError ? (
        <div className="card border-danger/30 bg-white px-4 py-3 text-sm text-danger">
          Sign-in failed ({params.authError}). Please try again.
        </div>
      ) : null}

      {dbError ? (
        <div className="card px-4 py-3 text-sm text-text-muted">
          Database unavailable. Start MySQL (`docker compose up mysql`) and set{" "}
          <code>DATABASE_URL</code>.
        </div>
      ) : null}

      <HomeFilters
        creator={params.creator ?? ""}
        creatorType={creatorType}
        sort={sort}
        creatorOptions={creatorOptions}
        labels={{
          filterCreator: messages.home.filterCreator,
          allCreators: messages.home.allCreators,
          filterCreatorType: messages.home.filterCreatorType,
          creatorTypeAll: messages.home.creatorTypeAll,
          creatorTypeAssociation: messages.home.creatorTypeAssociation,
          sortCreated: messages.home.sortCreated,
          sortEnd: messages.home.sortEnd,
          sortScore: messages.home.sortScore,
        }}
      />

      <div className="space-y-4">
        {polls.length === 0 && !dbError ? (
          <div className="card px-6 py-10 text-center text-text-muted">
            {messages.home.empty}
          </div>
        ) : null}
        {polls.map((poll) => {
          const creator = creators.get(poll.creator_username);
          return (
            <article
              key={poll.public_id}
              className="card px-5 py-5 transition hover:-translate-y-0.5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  <FsmeetProfileTrigger
                    username={poll.creator_username}
                    userType={creator?.type}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={creator?.imageUrl || "/avatar-fallback.svg"}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <span className="fsmeet-profile-name">
                      {creator
                        ? `${creator.firstName} ${creator.lastName}`
                        : poll.creator_username}
                    </span>
                  </FsmeetProfileTrigger>
                  {poll.status === "draft" ? (
                    <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-xs text-accent">
                      {messages.home.draft}
                    </span>
                  ) : null}
                </div>
                <Link href={pollHref(poll)} className="block space-y-3">
                  <h2 className="display text-2xl font-semibold">
                    {poll.question}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-sm text-text-muted">
                    <span>
                      {formatCount(messages.home.totalVotes, {
                        count: Number(poll.total_votes ?? 0),
                      })}
                    </span>
                    <span>
                      {formatCount(messages.home.totalComments, {
                        count: Number(poll.total_comments ?? 0),
                      })}
                    </span>
                    <span>Score {Number(poll.score ?? 0)}</span>
                    <span>{formatPollCardRemaining(poll.end_at)}</span>
                  </div>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
