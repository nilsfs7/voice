import {
  getFsmeetOAuthConfig,
  getOAuthCallbackUrl,
} from "@/lib/auth/config";

function pickString(
  obj: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

export type ProviderTokens = {
  accessToken: string;
  idToken?: string;
};

export type ProviderProfile = {
  providerUserId: string;
  username?: string;
  email?: string;
  displayName?: string;
  raw: Record<string, unknown>;
};

export function getAuthorizationUrl(params: {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}): string {
  const config = getFsmeetOAuthConfig();
  if (!config) throw new Error("FSMeet OAuth is not configured");

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("scope", config.scopes.join(" "));
  return url.toString();
}

export async function exchangeCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<ProviderTokens> {
  const config = getFsmeetOAuthConfig();
  if (!config) throw new Error("FSMeet OAuth is not configured");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: config.clientId,
    code_verifier: params.codeVerifier,
  });
  if (config.clientSecret) body.set("client_secret", config.clientSecret);

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`FSMeet token exchange failed (${res.status})`);
  }
  const accessToken = pickString(json, ["access_token", "accessToken"]);
  if (!accessToken) throw new Error("Missing access_token");
  return {
    accessToken,
    idToken: pickString(json, ["id_token", "idToken"]),
  };
}

export async function getUserinfo(
  accessToken: string,
): Promise<ProviderProfile> {
  const config = getFsmeetOAuthConfig();
  if (!config) throw new Error("FSMeet OAuth is not configured");

  const res = await fetch(config.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`FSMeet userinfo failed (${res.status})`);
  }
  const providerUserId = pickString(json, ["sub", "id", "userId"]);
  if (!providerUserId) throw new Error("userinfo missing sub");
  return {
    providerUserId,
    email: pickString(json, ["email"]),
    username: pickString(json, [
      "preferred_username",
      "username",
      "user_name",
    ]),
    displayName: pickString(json, ["name", "display_name", "displayName"]),
    raw: json,
  };
}

export function fsmeetRedirectUri(): string {
  return getOAuthCallbackUrl();
}
