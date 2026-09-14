import { cookies } from "next/headers";
import {
  AUTH_OAUTH_PENDING_COOKIE,
  getOAuthPendingTtlSec,
} from "@/lib/auth/config";

export type OAuthPending = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  exp: number;
};

export async function setOAuthPendingCookie(
  pending: Omit<OAuthPending, "exp">,
): Promise<void> {
  const jar = await cookies();
  const exp = Math.floor(Date.now() / 1000) + getOAuthPendingTtlSec();
  const value = Buffer.from(JSON.stringify({ ...pending, exp }), "utf8").toString(
    "base64url",
  );
  jar.set(AUTH_OAUTH_PENDING_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getOAuthPendingTtlSec(),
  });
}

export async function readOAuthPendingCookie(): Promise<OAuthPending | null> {
  const jar = await cookies();
  const raw = jar.get(AUTH_OAUTH_PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8"),
    ) as OAuthPending;
    if (!parsed.state || !parsed.codeVerifier || !parsed.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearOAuthPendingCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_OAUTH_PENDING_COOKIE);
}

export function sanitizeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
