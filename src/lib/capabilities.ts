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

export function displayName(user: Pick<FsmeetUser, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`.trim();
}
