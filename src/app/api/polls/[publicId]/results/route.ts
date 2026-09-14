import { NextResponse } from "next/server";
import { AGE_BUCKETS, ageBucketId, resultsVisible } from "@/lib/polls/rules";
import {
  getAbstentionCount,
  getDemographicBallots,
  getOptionCounts,
} from "@/lib/polls/ballots";
import { getOptions, getPollByPublicId } from "@/lib/polls/repository";
import { readSessionUser } from "@/lib/auth/session";

type Ctx = { params: Promise<{ publicId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll || poll.deleted_at) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const user = await readSessionUser();
  if (poll.status === "draft" && poll.creator_username !== user?.username) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const totalVotes = Number(poll.total_votes ?? 0);
  const showDetails = resultsVisible({
    liveResultShares: Boolean(poll.live_result_shares),
    endAt: new Date(poll.end_at),
  });

  if (!showDetails) {
    return NextResponse.json({
      totalVotes,
      showDetails: false,
      options: [],
      abstentions: 0,
      byGender: [],
      byAge: [],
    });
  }

  const options = await getOptions(poll.id);
  const counts = await getOptionCounts(poll.id);
  const countMap = new Map(counts.map((c) => [c.option_id, Number(c.votes)]));
  const abstentions = await getAbstentionCount(poll.id);
  const ballots = await getDemographicBallots(poll.id);

  const gender = { male: 0, female: 0, unknown: 0 };
  const ageCounts = Object.fromEntries(AGE_BUCKETS.map((b) => [b.id, 0])) as Record<
    string,
    number
  >;
  let ageUnknown = 0;
  for (const ballot of ballots) {
    if (ballot.voter_gender === "male") gender.male += 1;
    else if (ballot.voter_gender === "female") gender.female += 1;
    else gender.unknown += 1;
    const bucket = ageBucketId(ballot.voter_age);
    if (bucket) ageCounts[bucket] += 1;
    else ageUnknown += 1;
  }

  return NextResponse.json({
    totalVotes,
    showDetails: true,
    abstentions,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      votes: countMap.get(o.id) ?? 0,
    })),
    byGender: [
      { key: "male", label: "Male", votes: gender.male },
      { key: "female", label: "Female", votes: gender.female },
      { key: "unknown", label: "Unknown", votes: gender.unknown },
    ],
    byAge: [
      ...AGE_BUCKETS.map((b) => ({
        key: b.id,
        label: b.label,
        votes: ageCounts[b.id] ?? 0,
      })),
      { key: "unknown", label: "Unknown", votes: ageUnknown },
    ],
  });
}
