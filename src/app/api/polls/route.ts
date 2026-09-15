import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCreatePollAccess } from "@/lib/auth/create-poll-access";
import { readSessionUser } from "@/lib/auth/session";
import { pollHref } from "@/lib/polls/alias";
import {
  AliasConflictError,
  createPoll,
  InvalidAliasError,
  listPolls,
} from "@/lib/polls/repository";

const createSchema = z.object({
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
  startAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sortParam = url.searchParams.get("sort");
  const sort =
    sortParam === "end_at" || sortParam === "score" ? sortParam : "created_at";
  const creator = url.searchParams.get("creator");
  const user = await readSessionUser();
  const polls = await listPolls({
    sort,
    creator,
    viewerUsername: user?.username,
  });
  return NextResponse.json({
    polls: polls.map((p) => ({
      publicId: p.public_id,
      alias: p.alias,
      path: pollHref(p),
      question: p.question,
      status: p.status,
      creatorUsername: p.creator_username,
      totalVotes: Number(p.total_votes ?? 0),
      score: Number(p.score ?? 0),
      startAt: p.start_at,
      endAt: p.end_at,
      createdAt: p.created_at,
      choiceMode: p.choice_mode,
    })),
  });
}

export async function POST(req: Request) {
  const access = await requireCreatePollAccess();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.error, missing: access.missing },
      { status: access.status },
    );
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json({ error: "invalid_dates" }, { status: 400 });
  }
  if (endAt <= startAt) {
    return NextResponse.json({ error: "end_before_start" }, { status: 400 });
  }

  try {
    const created = await createPoll({
      creatorUsername: access.user.username,
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
      startAt,
      endAt,
      options: data.options,
    });

    return NextResponse.json(
      {
        publicId: created.publicId,
        alias: created.alias,
        path: pollHref({
          public_id: created.publicId,
          alias: created.alias,
        }),
      },
      { status: 201 },
    );
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
