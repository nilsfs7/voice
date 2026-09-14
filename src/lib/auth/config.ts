import { createHash } from "crypto";
import { getFsmeetApiBaseUrl, getSiteUrl } from "@/lib/env";

export const AUTH_SESSION_COOKIE = "voice_session";
export const AUTH_OAUTH_PENDING_COOKIE = "voice_oauth_pending";
export const AUTH_FSMEET_ACCESS_COOKIE = "voice_fsmeet_access";

const SESSION_TTL_SEC = 60 * 60 * 24 * 7;
const PENDING_TTL_SEC = 60 * 10;

const DEV_FALLBACK_SECRET = createHash("sha256")
  .update("voice-dev-auth-session")
  .digest("hex");

export function getAuthSessionTtlSec(): number {
  return SESSION_TTL_SEC;
}

export function getOAuthPendingTtlSec(): number {
  return PENDING_TTL_SEC;
}

export function getAuthSessionSecret(): string {
  const fromEnv = process.env.AUTH_SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SESSION_SECRET must be set in production.");
  }
  return DEV_FALLBACK_SECRET;
}

export function getOAuthCallbackUrl(): string {
  const fromEnv = process.env.AUTH_OAUTH_REDIRECT_BASE?.trim()?.replace(/\/$/, "");
  const base = fromEnv || getSiteUrl();
  return `${base}/api/auth/fsmeet/callback`;
}

export type FsmeetOAuthConfig = {
  clientId: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scopes: string[];
};

function defaultOAuthUrl(path: string): string {
  return `${getFsmeetApiBaseUrl()}/oauth/${path.replace(/^\//, "")}`;
}

export function getFsmeetOAuthConfig(): FsmeetOAuthConfig | null {
  const clientId = process.env.FSMEET_OAUTH_CLIENT_ID?.trim();
  if (!clientId) return null;

  const scopesRaw =
    process.env.FSMEET_OAUTH_SCOPES?.trim() || "openid profile email";
  const scopes = scopesRaw.split(/[\s,]+/).filter(Boolean);

  return {
    clientId,
    clientSecret: process.env.FSMEET_OAUTH_CLIENT_SECRET?.trim() || undefined,
    authorizeUrl:
      process.env.FSMEET_OAUTH_AUTHORIZE_URL?.trim() ||
      defaultOAuthUrl("authorize"),
    tokenUrl:
      process.env.FSMEET_OAUTH_TOKEN_URL?.trim() || defaultOAuthUrl("token"),
    userinfoUrl:
      process.env.FSMEET_OAUTH_USERINFO_URL?.trim() ||
      defaultOAuthUrl("userinfo"),
    scopes,
  };
}

export function isFsmeetOAuthConfigured(): boolean {
  return getFsmeetOAuthConfig() !== null;
}
