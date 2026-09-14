import { NextResponse } from "next/server";
import { canScore } from "@/lib/capabilities";
import {
  getFsmeetAccessToken,
  readSessionUser,
} from "@/lib/auth/session";
import { fetchFsmeetUser } from "@/lib/fsmeet/users";
import { upsertPollScore } from "@/lib/polls/comments";
import { getPollByPublicId } from "@/lib/polls/repository";
import { checkPollAgeEligibility } from "@/lib/polls/rules";

type Ctx = { params: Promise<{ publicId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await readSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!canScore(user.type)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { publicId } = await ctx.params;
  const poll = await getPollByPublicId(publicId);
  if (!poll || poll.deleted_at || poll.status !== "published") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (poll.creator_username === user.username) {
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

  const body = (await req.json()) as { value?: number };
  if (body.value !== 1 && body.value !== -1) {
    return NextResponse.json({ error: "invalid_value" }, { status: 400 });
  }
  await upsertPollScore(poll.id, user.username, body.value, poll.creator_username);
  return NextResponse.json({ ok: true });
}
