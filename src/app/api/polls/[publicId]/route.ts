import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatePollAccess } from "@/lib/auth/create-poll-access";
import { readSessionUser } from "@/lib/auth/session";
import { pollHref } from "@/lib/polls/alias";
import {
  AliasConflictError,
  getOptions,
  getPollByPublicId,
  InvalidAliasError,
  publishPoll,
  softDeletePoll,
  updateDraftPoll,
} from "@/lib/polls/repository";

type Ctx = { params: Promise<{ publicId: string }> };

const updateSchema = z.object({
  question: z.string().trim().min(3).max(500),
  description: z.string().trim().max(5000).optional().nullable(),
  alias: z.string().trim().max(64).optional().nullable(),
  choiceMode: z.enum(["single", "multiple"]),
  liveResultShares: z.boolean(),
  countryCode: z.string().trim().max(8).optional().nullable(),
  continentalCode: z.string().trim().max(8).optional().nullable(),
  minAge: z.number().int().min(0).max(120).optional().nullable(),
  maxAge: z.number().int().min(0).max(120).optional().nullable(),
  gender: z.enum(["male", "female"]).optional().nullable(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  options: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(300),
        description: z.string().trim().max(2000).optional().nullable(),
      }),
    )
    .min(2)
    .max(20),
});

export async function GET(_req: Request, ctx: Ctx) {
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll || poll.deleted_at) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const user = await readSessionUser();
  if (
    poll.status === "draft" &&
    poll.creator_username !== user?.username
  ) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const options = await getOptions(poll.id);
  return NextResponse.json({
    poll: {
      publicId: poll.public_id,
      alias: poll.alias,
      path: pollHref(poll),
      question: poll.question,
      description: poll.description,
      choiceMode: poll.choice_mode,
      status: poll.status,
      liveResultShares: Boolean(poll.live_result_shares),
      countryCode: poll.country_code,
      continentalCode: poll.continental_code,
      minAge: poll.min_age,
      maxAge: poll.max_age,
      gender: poll.gender,
      startAt: poll.start_at,
      endAt: poll.end_at,
      creatorUsername: poll.creator_username,
      totalVotes: Number(poll.total_votes ?? 0),
      score: Number(poll.score ?? 0),
    },
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      description: o.description,
    })),
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const access = await requireCreatePollAccess();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, missing: access.missing },
      { status: access.status },
    );
  }
  const { publicId } = await ctx.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = parsed.data;
  try {
    const ok = await updateDraftPoll(publicId, access.user.username, {
      question: data.question,
      description: data.description,
      alias: data.alias,
      choiceMode: data.choiceMode,
      liveResultShares: data.liveResultShares,
      countryCode: data.countryCode,
      continentalCode: data.continentalCode,
      minAge: data.minAge,
      maxAge: data.maxAge,
      gender: data.gender,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      options: data.options,
    });
    if (!ok) {
      return NextResponse.json({ error: "not_editable" }, { status: 409 });
    }
    const poll = await getPollByPublicId(publicId);
    return NextResponse.json({
      ok: true,
      path: poll ? pollHref(poll) : `/polls/${publicId}`,
      alias: poll?.alias ?? null,
      publicId: poll?.public_id ?? publicId,
    });
  } catch (error) {
    if (error instanceof InvalidAliasError) {
      return NextResponse.json({ error: "invalid_alias" }, { status: 400 });
    }
    if (error instanceof AliasConflictError) {
      return NextResponse.json({ error: "alias_taken" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const access = await requireCreatePollAccess();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, missing: access.missing },
      { status: access.status },
    );
  }
  const { publicId } = await ctx.params;
  const ok = await softDeletePoll(publicId, access.user.username);
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const access = await requireCreatePollAccess();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, missing: access.missing },
      { status: access.status },
    );
  }
  const { publicId } = await ctx.params;
  const body = (await req.json()) as { action?: string };
  if (body.action === "publish") {
    const ok = await publishPoll(publicId, access.user.username);
    if (!ok) {
      return NextResponse.json({ error: "cannot_publish" }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
