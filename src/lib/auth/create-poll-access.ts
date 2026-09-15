import { getFsmeetAccessToken, readSessionUser } from "@/lib/auth/session";
import {
  canCreatePoll,
  checkCreatePollTrustGate,
  type FsmeetUser,
  type UserType,
} from "@/lib/capabilities";
import { fetchFsmeetUser } from "@/lib/fsmeet/users";

type SessionLike = { username: string; type: UserType };

export type CreatePollAuthResult =
  | { ok: true; user: SessionLike; profile: FsmeetUser }
  | {
      ok: false;
      status: number;
      error: string;
      missing?: string[];
    };

/** Session + §4.1 create type + FR-PO-009b trust gate. */
export async function requireCreatePollAccess(): Promise<CreatePollAuthResult> {
  const user = await readSessionUser();
  if (!user) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  if (!canCreatePoll(user.type)) {
    return { ok: false, status: 403, error: "forbidden" };
  }

  const accessToken = await getFsmeetAccessToken();
  const profile = await fetchFsmeetUser(user.username, accessToken);
  if (!profile) {
    return { ok: false, status: 502, error: "user_lookup_failed" };
  }

  const trust = checkCreatePollTrustGate(profile);
  if (!trust.ok) {
    return {
      ok: false,
      status: 403,
      error: trust.reason,
      missing: trust.missing,
    };
  }

  return { ok: true, user, profile };
}
