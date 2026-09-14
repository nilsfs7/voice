import type { FsmeetUser, UserType } from "@/lib/capabilities";
import { getFsmeetApiBaseUrl } from "@/lib/env";

const USER_TYPES = new Set<UserType>([
  "association",
  "brand",
  "dj",
  "event_organizer",
  "fan",
  "freestyler",
  "mc",
  "media",
  "administrative",
]);

function asUserType(value: unknown): UserType {
  if (typeof value === "string" && USER_TYPES.has(value as UserType)) {
    return value as UserType;
  }
  return "fan";
}

export function mapFsmeetUser(raw: Record<string, unknown>): FsmeetUser {
  const ageRaw = raw.age;
  const age =
    typeof ageRaw === "number"
      ? ageRaw
      : typeof ageRaw === "string" && ageRaw.trim() !== ""
        ? Number(ageRaw)
        : null;
  return {
    username: String(raw.username ?? ""),
    type: asUserType(raw.type),
    imageUrl: String(raw.imageUrl ?? ""),
    firstName: String(raw.firstName ?? ""),
    lastName: String(raw.lastName ?? ""),
    gender:
      raw.gender === "male" || raw.gender === "female" ? raw.gender : null,
    countryCode:
      typeof raw.countryCode === "string" ? raw.countryCode : null,
    continentalCode:
      typeof raw.continentalCode === "string" ? raw.continentalCode : null,
    age: age != null && Number.isFinite(age) ? age : null,
  };
}

async function readJsonObject(
  res: Response,
): Promise<Record<string, unknown> | null> {
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!text) return null;
  if (
    !contentType.includes("application/json") &&
    (text.trimStart().startsWith("<!") || text.trimStart().startsWith("<html"))
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function fetchFsmeetUser(
  username: string,
  accessToken?: string | null,
): Promise<FsmeetUser | null> {
  if (!username.trim()) return null;
  const url = `${getFsmeetApiBaseUrl()}/users/${encodeURIComponent(username)}`;
  const headers: HeadersInit = { Accept: "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store" });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const json = await readJsonObject(res);
  if (!json) return null;
  const user = mapFsmeetUser(json);
  if (!user.username) return null;
  return user;
}

export async function fetchFsmeetUsers(
  usernames: string[],
): Promise<Map<string, FsmeetUser>> {
  const unique = [...new Set(usernames.filter(Boolean))];
  const map = new Map<string, FsmeetUser>();
  await Promise.all(
    unique.map(async (username) => {
      const user = await fetchFsmeetUser(username);
      if (user) map.set(username, user);
    }),
  );
  return map;
}
