import { NextResponse } from "next/server";
import { z } from "zod";
import { canVote, checkVotePresenceGate } from "@/lib/capabilities";
import {
  getFsmeetAccessToken,
  readSessionUser,
} from "@/lib/auth/session";
import { fetchFsmeetUser } from "@/lib/fsmeet/users";
import { getBallot, upsertBallot } from "@/lib/polls/ballots";
import { getOptions, getPollByPublicId } from "@/lib/polls/repository";
import {
  checkAudienceEligibility,
  pollIsOpen,
} from "@/lib/polls/rules";

type Ctx = { params: Promise<{ publicId: string }> };

const voteSchema = z.object({
  isAbstention: z.boolean(),
  optionIds: z.array(z.number().int().positive()).default([]),
});

export async function GET(_req: Request, ctx: Ctx) {
  const user = await readSessionUser();
  if (!user) return NextResponse.json({ ballot: null });
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const ballot = await getBallot(poll.id, user.username);
  return NextResponse.json({
    ballot: ballot
      ? {
          isAbstention: Boolean(ballot.ballot.is_abstention),
          optionIds: ballot.optionIds,
        }
      : null,
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!canVote(user.type)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll || poll.deleted_at || poll.status !== "published") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (
    !pollIsOpen({
      startAt: new Date(poll.start_at),
      endAt: new Date(poll.end_at),
      status: poll.status,
      deletedAt: poll.deleted_at,
    })
  ) {
    return NextResponse.json({ error: "poll_closed" }, { status: 409 });
  }

  const parsed = voteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const accessToken = await getFsmeetAccessToken();
  const fsmeetUser = await fetchFsmeetUser(user.username, accessToken);
  if (!fsmeetUser) {
    return NextResponse.json({ error: "user_lookup_failed" }, { status: 502 });
  }

  const presence = checkVotePresenceGate(fsmeetUser);
  if (!presence.ok) {
    return NextResponse.json(
      {
        error: "profile_presence",
        missing: presence.missing,
      },
      { status: 403 },
    );
  }

  const eligibility = checkAudienceEligibility(
    {
      countryCode: poll.country_code,
      continentalCode: poll.continental_code,
      minAge: poll.min_age,
      maxAge: poll.max_age,
      gender: poll.gender,
    },
    fsmeetUser,
  );
  if (!eligibility.ok) {
    return NextResponse.json(
      {
        error: eligibility.reason,
        missing: eligibility.missing,
      },
      { status: 403 },
    );
  }

  const { isAbstention, optionIds } = parsed.data;
  const options = await getOptions(poll.id);
  const validIds = new Set(options.map((o) => o.id));

  if (isAbstention && optionIds.length > 0) {
    return NextResponse.json({ error: "abstention_exclusive" }, { status: 400 });
  }
  if (!isAbstention) {
    if (optionIds.length === 0) {
      return NextResponse.json({ error: "no_option" }, { status: 400 });
    }
    if (poll.choice_mode === "single" && optionIds.length !== 1) {
      return NextResponse.json({ error: "single_required" }, { status: 400 });
    }
    if (optionIds.some((id) => !validIds.has(id))) {
      return NextResponse.json({ error: "invalid_option" }, { status: 400 });
    }
  }

  await upsertBallot({
    pollId: poll.id,
    username: user.username,
    isAbstention,
    optionIds: isAbstention ? [] : optionIds,
    voterAge: fsmeetUser.age ?? null,
    voterGender: fsmeetUser.gender ?? null,
  });

  return NextResponse.json({ ok: true });
}
