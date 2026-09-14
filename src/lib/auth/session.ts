import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserType } from "@/lib/capabilities";
import {
  AUTH_FSMEET_ACCESS_COOKIE,
  AUTH_SESSION_COOKIE,
  getAuthSessionSecret,
  getAuthSessionTtlSec,
} from "@/lib/auth/config";

export type SessionUser = {
  username: string;
  type: UserType;
  firstName: string;
  lastName: string;
  imageUrl: string;
};

function secretKey() {
  return new TextEncoder().encode(getAuthSessionSecret());
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${getAuthSessionTtlSec()}s`)
    .sign(secretKey());
}

export async function readSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const user = payload.user as SessionUser | undefined;
    if (!user?.username || !user.type) return null;
    return user;
  } catch {
    return null;
  }
}

export async function setSessionCookies(opts: {
  user: SessionUser;
  accessToken: string;
}): Promise<void> {
  const jar = await cookies();
  const token = await createSessionToken(opts.user);
  const secure = process.env.NODE_ENV === "production";
  jar.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: getAuthSessionTtlSec(),
  });
  jar.set(AUTH_FSMEET_ACCESS_COOKIE, opts.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: getAuthSessionTtlSec(),
  });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(AUTH_SESSION_COOKIE);
  jar.delete(AUTH_FSMEET_ACCESS_COOKIE);
}

export async function getFsmeetAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(AUTH_FSMEET_ACCESS_COOKIE)?.value ?? null;
}
