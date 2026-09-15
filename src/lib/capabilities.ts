export type UserType =
  | "association"
  | "brand"
  | "dj"
  | "event_organizer"
  | "fan"
  | "freestyler"
  | "mc"
  | "media"
  | "administrative";

export type FsmeetVerificationState =
  | "not_verified"
  | "pending"
  | "verified"
  | string;

export type FsmeetUser = {
  username: string;
  type: UserType;
  imageUrl: string;
  firstName: string;
  lastName: string;
  gender?: "male" | "female" | null;
  countryCode?: string | null;
  continentalCode?: string | null;
  age?: number | null;
  wffaId?: string | null;
  verificationState?: FsmeetVerificationState | null;
  instagramHandle?: string | null;
  tikTokHandle?: string | null;
  youTubeHandle?: string | null;
};

const CREATE_TYPES = new Set<UserType>([
  "association",
  "dj",
  "freestyler",
  "event_organizer",
  "mc",
  "media",
]);

const VOTE_TYPES = new Set<UserType>([
  "dj",
  "freestyler",
  "event_organizer",
  "mc",
  "media",
]);

const SCORE_TYPES = new Set<UserType>([
  "brand",
  "dj",
  "event_organizer",
  "freestyler",
  "mc",
  "media",
  "administrative",
]);

export function canCreatePoll(type: UserType): boolean {
  return CREATE_TYPES.has(type);
}

export function canVote(type: UserType): boolean {
  return VOTE_TYPES.has(type);
}

export function canComment(_type: UserType): boolean {
  return true;
}

export function canScore(type: UserType): boolean {
  return SCORE_TYPES.has(type);
}

/** Fixed Voice admin username (FR-AD-001 / U-07). */
export const VOICE_ADMIN_USERNAME = "fsmeet";

export function isVoiceAdmin(username: string | null | undefined): boolean {
  return username?.trim() === VOICE_ADMIN_USERNAME;
}

export function displayName(user: Pick<FsmeetUser, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

function present(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function isFsmeetVerified(
  user: Pick<FsmeetUser, "verificationState">,
): boolean {
  return user.verificationState === "verified";
}

/** FR-PO-009b — in addition to canCreatePoll(type). */
export function passesCreatePollTrustGate(
  user: Pick<FsmeetUser, "wffaId" | "verificationState">,
): boolean {
  return present(user.wffaId) || isFsmeetVerified(user);
}

/** FR-VO-012 — in addition to canVote(type). */
export function passesVotePresenceGate(
  user: Pick<
    FsmeetUser,
    | "wffaId"
    | "verificationState"
    | "instagramHandle"
    | "tikTokHandle"
    | "youTubeHandle"
  >,
): boolean {
  return (
    present(user.wffaId) ||
    isFsmeetVerified(user) ||
    present(user.instagramHandle) ||
    present(user.tikTokHandle) ||
    present(user.youTubeHandle)
  );
}

export type ProfileGateResult =
  | { ok: true }
  | { ok: false; reason: "missing_fields" | "profile_presence"; missing: string[] };

export function checkCreatePollTrustGate(
  user: Pick<FsmeetUser, "wffaId" | "verificationState">,
): ProfileGateResult {
  if (passesCreatePollTrustGate(user)) return { ok: true };
  return {
    ok: false,
    reason: "missing_fields",
    missing: ["verified account"],
  };
}

export function checkVotePresenceGate(
  user: Pick<
    FsmeetUser,
    | "wffaId"
    | "verificationState"
    | "instagramHandle"
    | "tikTokHandle"
    | "youTubeHandle"
  >,
): ProfileGateResult {
  if (passesVotePresenceGate(user)) return { ok: true };
  return {
    ok: false,
    reason: "profile_presence",
    missing: [
      "verified account, or Instagram / TikTok / YouTube handle",
    ],
  };
}
