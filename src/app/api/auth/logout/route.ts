import { NextResponse } from "next/server";
import {
  AUTH_FSMEET_ACCESS_COOKIE,
  AUTH_SESSION_COOKIE,
} from "@/lib/auth/config";
import { getSiteUrl } from "@/lib/env";

function logoutRedirect() {
  const response = NextResponse.redirect(getSiteUrl(), 303);
  const secure = process.env.NODE_ENV === "production";
  const clear = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(AUTH_SESSION_COOKIE, "", clear);
  response.cookies.set(AUTH_FSMEET_ACCESS_COOKIE, "", clear);
  return response;
}

export async function POST() {
  return logoutRedirect();
}

export async function GET() {
  return logoutRedirect();
}
