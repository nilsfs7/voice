import { notFound, redirect } from 'next/navigation';
import { CommentsSection } from '@/components/CommentsSection';
import { CreatorBallotRoster } from '@/components/CreatorBallotRoster';
import { FsmeetProfileTrigger } from '@/components/FsmeetProfileTrigger';
import { PollActions } from '@/components/PollActions';
import { PollAudienceRules } from '@/components/PollAudienceRules';
import { ResultCharts } from '@/components/ResultCharts';
import { SharePollButton } from '@/components/SharePollButton';
import { VotePanel } from '@/components/VotePanel';
import { canCreatePoll, canScore, canVote, checkVotePresenceGate, displayName } from '@/lib/capabilities';
import { getFsmeetAccessToken, readSessionUser } from '@/lib/auth/session';
import { getSiteUrl } from '@/lib/env';
import { fetchFsmeetUser, fetchFsmeetUsers } from '@/lib/fsmeet/users';
import { formatCount, t } from '@/lib/i18n';
import { getAbstentionCount, getBallot, getDemographicBallots, getOptionCounts, listNamedBallotsForPoll } from '@/lib/polls/ballots';
import { listComments, upsertPollScore } from '@/lib/polls/comments';
import { getOptions, getPollByPublicId } from '@/lib/polls/repository';
import { pollHref } from '@/lib/polls/alias';
import { AGE_BUCKETS, ageBucketId, checkPollAgeEligibility, pollIsOpen, resultsVisible } from '@/lib/polls/rules';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ publicId: string }> };

export default async function PollPage({ params }: Ctx) {
  const { publicId } = await params;
  const messages = t();
  const user = await readSessionUser();

  let poll;
  try {
    poll = await getPollByPublicId(publicId);
  } catch {
    return <div className="card p-6 text-sm text-text-muted">Database unavailable.</div>;
  }

  if (!poll || poll.deleted_at) notFound();
  if (poll.status === 'draft' && poll.creator_username !== user?.username) {
    notFound();
  }

  const options = await getOptions(poll.id);
  const creatorMap = await fetchFsmeetUsers([poll.creator_username]);
  const creator = creatorMap.get(poll.creator_username);
  const ballot = user ? await getBallot(poll.id, user.username) : null;
  const comments = await listComments(poll.id);
  const commentAuthors = await fetchFsmeetUsers(comments.map(c => c.author_username));

  let ageGate: { ok: true } | { ok: false; reason: string; missing: string[] } = { ok: true };
  let voteGate: { ok: true } | { ok: false; reason: string; missing: string[] } = { ok: true };
  if (user) {
    const accessToken = await getFsmeetAccessToken();
    const viewer = await fetchFsmeetUser(user.username, accessToken);
    ageGate = checkPollAgeEligibility(poll, viewer?.age);
    if (canVote(user.type) && viewer) {
      const presence = checkVotePresenceGate(viewer);
      voteGate = presence.ok ? ageGate : presence;
    } else if (canVote(user.type) && !viewer) {
      voteGate = {
        ok: false,
        reason: 'profile_presence',
        missing: ['verified account, or Instagram / TikTok / YouTube handle'],
      };
    }
  }

  const open = pollIsOpen({
    startAt: new Date(poll.start_at),
    endAt: new Date(poll.end_at),
    status: poll.status,
    deletedAt: poll.deleted_at,
  });
  const showDetails = resultsVisible({
    liveResultShares: Boolean(poll.live_result_shares),
    endAt: new Date(poll.end_at),
  });

  const totalVotes = Number(poll.total_votes ?? 0);
  let optionVotes: { id: number; label: string; votes: number }[] = [];
  let abstentions = 0;
  let byGender: { key: string; label: string; votes: number }[] = [];
  let byAge: { key: string; label: string; votes: number }[] = [];

  if (showDetails) {
    const counts = await getOptionCounts(poll.id);
    const countMap = new Map(counts.map(c => [c.option_id, Number(c.votes)]));
    optionVotes = options.map(o => ({
      id: o.id,
      label: o.label,
      votes: countMap.get(o.id) ?? 0,
    }));
    abstentions = await getAbstentionCount(poll.id);
    const ballots = await getDemographicBallots(poll.id);
    const gender = { male: 0, female: 0, unknown: 0 };
    const ageCounts = Object.fromEntries(AGE_BUCKETS.map(b => [b.id, 0])) as Record<string, number>;
    let ageUnknown = 0;
    for (const b of ballots) {
      if (b.voter_gender === 'male') gender.male += 1;
      else if (b.voter_gender === 'female') gender.female += 1;
      else gender.unknown += 1;
      const bucket = ageBucketId(b.voter_age);
      if (bucket) ageCounts[bucket] += 1;
      else ageUnknown += 1;
    }
    byGender = [
      { key: 'male', label: 'Male', votes: gender.male },
      { key: 'female', label: 'Female', votes: gender.female },
      { key: 'unknown', label: 'Unknown', votes: gender.unknown },
    ];
    byAge = [
      ...AGE_BUCKETS.map(b => ({
        key: b.id,
        label: b.label,
        votes: ageCounts[b.id] ?? 0,
      })),
      { key: 'unknown', label: 'Unknown', votes: ageUnknown },
    ];
  }

  const userCanVote = Boolean(user && canVote(user.type) && open);
  const userCanScore = Boolean(user && canScore(user.type) && ageGate.ok);
  const isCreator = user?.username === poll.creator_username;
  const shareUrl = `${getSiteUrl()}${pollHref(poll)}`;

  let rosterEntries: {
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
  }[] = [];
  if (isCreator && poll.status === 'published') {
    const named = await listNamedBallotsForPoll(poll.id);
    const voters = await fetchFsmeetUsers(named.map(b => b.voter_username));
    rosterEntries = named.map(b => {
      const voter = voters.get(b.voter_username);
      return {
        voterUsername: b.voter_username,
        isAbstention: Boolean(b.is_abstention),
        optionLabels: b.option_labels,
        updatedAt: new Date(b.updated_at).toISOString(),
        voter: voter
          ? {
              firstName: voter.firstName,
              lastName: voter.lastName,
              imageUrl: voter.imageUrl,
              type: voter.type,
            }
          : undefined,
      };
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <FsmeetProfileTrigger username={poll.creator_username} userType={creator?.type}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={creator?.imageUrl || '/avatar-fallback.svg'} alt="" className="h-10 w-10 rounded-full object-cover" />
            <span className="fsmeet-profile-name font-medium text-text">{creator ? displayName(creator) : poll.creator_username}</span>
          </FsmeetProfileTrigger>
          <span>·</span>
          <span>
            {poll.status === 'draft' ? 'Draft · ' : ''}
            {poll.choice_mode === 'single' ? messages.poll.single : messages.poll.multiple}
          </span>
        </div>
        <h1 className="display text-4xl font-semibold sm:text-5xl">{poll.question}</h1>
        {poll.description ? <p className="max-w-3xl text-lg leading-relaxed text-text-muted">{poll.description}</p> : null}
        <div className="flex flex-wrap gap-3 text-sm text-text-muted">
          <span>{formatCount(messages.home.totalVotes, { count: totalVotes })}</span>
          <span>Score {Number(poll.score ?? 0)}</span>
          <span>
            {new Date(poll.start_at).toLocaleString('en-GB')} → {new Date(poll.end_at).toLocaleString('en-GB')}
          </span>
        </div>
        <PollAudienceRules countryCode={poll.country_code} continentalCode={poll.continental_code} minAge={poll.min_age} maxAge={poll.max_age} gender={poll.gender} />
        {poll.status === 'published' ? <SharePollButton url={shareUrl} /> : null}
        {isCreator ? <PollActions publicId={poll.alias || poll.public_id} status={poll.status} canEdit={poll.status === 'draft' && canCreatePoll(user!.type)} /> : null}
        {userCanScore && !isCreator && poll.status === 'published' ? (
          <div className="flex gap-2">
            <ScoreForm publicId={poll.alias || poll.public_id} value={1} label="Upvote" />
            <ScoreForm publicId={poll.alias || poll.public_id} value={-1} label="Downvote" />
          </div>
        ) : null}
      </div>

      {poll.status === 'published' ? (
        <VotePanel
          publicId={poll.alias || poll.public_id}
          choiceMode={poll.choice_mode}
          options={options.map(o => ({
            id: o.id,
            label: o.label,
            description: o.description,
          }))}
          canVoteNow={userCanVote}
          loggedIn={Boolean(user)}
          ageGate={user ? voteGate : undefined}
          initial={
            ballot
              ? {
                  isAbstention: Boolean(ballot.ballot.is_abstention),
                  optionIds: ballot.optionIds,
                }
              : null
          }
        />
      ) : (
        <div className="card p-5 text-sm text-text-muted">This draft is only visible to you. Publish it when ready.</div>
      )}

      <ResultCharts showDetails={showDetails} totalVotes={totalVotes} options={optionVotes} abstentions={abstentions} byGender={byGender} byAge={byAge} />

      {isCreator && poll.status === 'published' ? <CreatorBallotRoster publicId={poll.alias || poll.public_id} entries={rosterEntries} /> : null}

      {poll.status === 'published' ? (
        <CommentsSection
          publicId={poll.alias || poll.public_id}
          loggedIn={Boolean(user)}
          canScore={userCanScore}
          currentUsername={user?.username}
          pollCreatorUsername={poll.creator_username}
          ageGate={user ? (isCreator ? { ok: true } : ageGate) : undefined}
          initial={comments.map(c => {
            const author = commentAuthors.get(c.author_username);
            return {
              id: c.id,
              authorUsername: c.author_username,
              rootId: c.root_id,
              body: c.deleted_at ? null : c.body,
              deleted: Boolean(c.deleted_at),
              createdAt: new Date(c.created_at).toISOString(),
              score: Number(c.score ?? 0),
              author: author
                ? {
                    firstName: author.firstName,
                    lastName: author.lastName,
                    imageUrl: author.imageUrl,
                    type: author.type,
                  }
                : undefined,
            };
          })}
        />
      ) : null}
    </div>
  );
}

function ScoreForm({ publicId, value, label }: { publicId: string; value: 1 | -1; label: string }) {
  async function action() {
    'use server';
    const user = await readSessionUser();
    if (!user || !canScore(user.type)) return;
    const poll = await getPollByPublicId(publicId);
    if (!poll || poll.creator_username === user.username) return;
    const accessToken = await getFsmeetAccessToken();
    const fsmeetUser = await fetchFsmeetUser(user.username, accessToken);
    if (!checkPollAgeEligibility(poll, fsmeetUser?.age).ok) return;
    await upsertPollScore(poll.id, user.username, value, poll.creator_username);
    redirect(pollHref(poll));
  }

  return (
    <form action={action}>
      <button className="btn btn-secondary text-sm" type="submit">
        {label}
      </button>
    </form>
  );
}
