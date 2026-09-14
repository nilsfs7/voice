import { NextResponse } from "next/server";
import type { UserType } from "@/lib/capabilities";
import { getOAuthCallbackUrl } from "@/lib/auth/config";
import { exchangeCode, getUserinfo } from "@/lib/auth/fsmeet-oauth";
import {
  clearOAuthPendingCookie,
  readOAuthPendingCookie,
} from "@/lib/auth/oauth-pending";
import { setSessionCookies } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/env";
import { fetchFsmeetUser } from "@/lib/fsmeet/users";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const pending = await readOAuthPendingCookie();

  const fail = async (reason: string) => {
    await clearOAuthPendingCookie();
    return NextResponse.redirect(
      `${getSiteUrl()}/?authError=${encodeURIComponent(reason)}`,
    );
  };

  if (!code || !state || !pending || pending.state !== state) {
    return fail("invalid_oauth_state");
  }

  try {
    const tokens = await exchangeCode({
      code,
      redirectUri: getOAuthCallbackUrl(),
      codeVerifier: pending.codeVerifier,
    });
    const profile = await getUserinfo(tokens.accessToken);
    const username =
      profile.username ||
      (typeof profile.raw.preferred_username === "string"
        ? profile.raw.preferred_username
        : null);
    if (!username) return fail("missing_username");

    const fsmeetUser = await fetchFsmeetUser(username, tokens.accessToken);
    if (!fsmeetUser) return fail("user_lookup_failed");

    await setSessionCookies({
      user: {
        username: fsmeetUser.username,
        type: fsmeetUser.type as UserType,
        firstName: fsmeetUser.firstName,
        lastName: fsmeetUser.lastName,
        imageUrl: fsmeetUser.imageUrl,
      },
      accessToken: tokens.accessToken,
    });
    await clearOAuthPendingCookie();
    return NextResponse.redirect(`${getSiteUrl()}${pending.returnTo || "/"}`);
  } catch {
    return fail("oauth_exchange_failed");
  }
}
