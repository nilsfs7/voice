import { NextResponse } from "next/server";
import { getOAuthCallbackUrl, isFsmeetOAuthConfigured } from "@/lib/auth/config";
import { getAuthorizationUrl } from "@/lib/auth/fsmeet-oauth";
import {
  sanitizeReturnTo,
  setOAuthPendingCookie,
} from "@/lib/auth/oauth-pending";
import {
  codeChallengeS256,
  generateCodeVerifier,
  generateOAuthState,
} from "@/lib/auth/pkce";

export async function GET(req: Request) {
  if (!isFsmeetOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "OAuth not configured",
        hint: "Set FSMEET_OAUTH_CLIENT_ID",
      },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const returnTo = sanitizeReturnTo(url.searchParams.get("returnTo"));
  const state = generateOAuthState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeS256(codeVerifier);
  const redirectUri = getOAuthCallbackUrl();

  await setOAuthPendingCookie({ state, codeVerifier, returnTo });

  const authorizeUrl = getAuthorizationUrl({
    state,
    codeChallenge,
    redirectUri,
  });

  return NextResponse.redirect(authorizeUrl);
}
