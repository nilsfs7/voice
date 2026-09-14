import { NextResponse } from "next/server";
import { z } from "zod";
import { canComment, canScore } from "@/lib/capabilities";
import {
  getFsmeetAccessToken,
  readSessionUser,
} from "@/lib/auth/session";
import { fetchFsmeetUser } from "@/lib/fsmeet/users";
import {
  createComment,
  getComment,
  listComments,
  softDeleteComment,
  upsertCommentScore,
} from "@/lib/polls/comments";
import { getPollByPublicId } from "@/lib/polls/repository";
import { checkPollAgeEligibility } from "@/lib/polls/rules";

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
  const comments = await listComments(poll.id);
  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      authorUsername: c.author_username,
      rootId: c.root_id,
      body: c.deleted_at ? null : c.body,
      deleted: Boolean(c.deleted_at),
      createdAt: c.created_at,
      score: Number(c.score ?? 0),
    })),
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await readSessionUser();
  if (!user || !canComment(user.type)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll || poll.deleted_at || poll.status !== "published") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const accessToken = await getFsmeetAccessToken();
  const fsmeetUser = await fetchFsmeetUser(user.username, accessToken);
  if (!fsmeetUser) {
    return NextResponse.json({ error: "user_lookup_failed" }, { status: 502 });
  }
  // FR-CO-010: poll creator may comment regardless of audience filters
  const isCreator = user.username === poll.creator_username;
  if (!isCreator) {
    const ageCheck = checkPollAgeEligibility(poll, fsmeetUser.age);
    if (!ageCheck.ok) {
      return NextResponse.json(
        {
          error: ageCheck.reason,
          missing: ageCheck.missing,
        },
        { status: 403 },
      );
    }
  }

  const parsed = z
    .object({
      body: z.string().min(1).max(4000),
      rootId: z.number().int().positive().optional().nullable(),
    })
    .safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (parsed.data.rootId) {
    const root = await getComment(parsed.data.rootId);
    if (!root || root.poll_id !== poll.id || root.root_id) {
      return NextResponse.json({ error: "invalid_root" }, { status: 400 });
    }
  }
  const id = await createComment({
    pollId: poll.id,
    authorUsername: user.username,
    body: parsed.data.body,
    rootId: parsed.data.rootId,
  });
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const body = (await req.json()) as { commentId?: number };
  if (!body.commentId) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const ok = await softDeleteComment({
    commentId: body.commentId,
    actorUsername: user.username,
    pollCreatorUsername: poll.creator_username,
  });
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await readSessionUser();
  if (!user || !canScore(user.type)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const body = (await req.json()) as { commentId?: number; value?: number };
  if (!body.commentId || (body.value !== 1 && body.value !== -1)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const comment = await getComment(body.commentId);
  if (!comment || comment.poll_id !== poll.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (comment.author_username === user.username) {
    return NextResponse.json({ error: "cannot_score_own" }, { status: 403 });
  }

  const accessToken = await getFsmeetAccessToken();
  const fsmeetUser = await fetchFsmeetUser(user.username, accessToken);
  if (!fsmeetUser) {
    return NextResponse.json({ error: "user_lookup_failed" }, { status: 502 });
  }
  const ageCheck = checkPollAgeEligibility(poll, fsmeetUser.age);
  if (!ageCheck.ok) {
    return NextResponse.json(
      {
        error: ageCheck.reason,
        missing: ageCheck.missing,
      },
      { status: 403 },
    );
  }

  await upsertCommentScore(
    body.commentId,
    user.username,
    body.value,
    comment.author_username,
  );
  return NextResponse.json({ ok: true });
}
