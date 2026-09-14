export const AGE_BUCKETS = [
  { id: "<16", label: "Under 16", min: 0, max: 15 },
  { id: "16-20", label: "16–20", min: 16, max: 20 },
  { id: "21-25", label: "21–25", min: 21, max: 25 },
  { id: "26-30", label: "26–30", min: 26, max: 30 },
  { id: "31-35", label: "31–35", min: 31, max: 35 },
  { id: ">35", label: "Over 35", min: 36, max: 200 },
] as const;

export function ageBucketId(age: number | null | undefined): string | null {
  if (age == null || Number.isNaN(age)) return null;
  for (const bucket of AGE_BUCKETS) {
    if (age >= bucket.min && age <= bucket.max) return bucket.id;
  }
  return null;
}

export type PollFilters = {
  countryCode?: string | null;
  continentalCode?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  gender?: "male" | "female" | null;
};

export type DemographicCheck =
  | { ok: true }
  | { ok: false; reason: "missing_fields" | "ineligible"; missing: string[] };

export function checkAudienceEligibility(
  filters: PollFilters,
  user: {
    age?: number | null;
    gender?: string | null;
    countryCode?: string | null;
    continentalCode?: string | null;
  },
): DemographicCheck {
  const missing: string[] = [];
  const needsCountry = Boolean(filters.countryCode);
  const needsContinent = Boolean(filters.continentalCode);
  const needsAge =
    filters.minAge != null || filters.maxAge != null;
  const needsGender = Boolean(filters.gender);

  if (needsCountry && !user.countryCode) missing.push("country");
  if (needsContinent && !user.continentalCode) missing.push("region");
  if (needsAge && (user.age == null || Number.isNaN(user.age))) {
    missing.push("age");
  }
  if (needsGender && !user.gender) missing.push("gender");

  if (missing.length) {
    return { ok: false, reason: "missing_fields", missing };
  }

  if (
    filters.countryCode &&
    user.countryCode?.toUpperCase() !== filters.countryCode.toUpperCase()
  ) {
    return { ok: false, reason: "ineligible", missing: [] };
  }
  if (
    filters.continentalCode &&
    user.continentalCode?.toUpperCase() !==
      filters.continentalCode.toUpperCase()
  ) {
    return { ok: false, reason: "ineligible", missing: [] };
  }
  if (filters.minAge != null && (user.age as number) < filters.minAge) {
    return { ok: false, reason: "ineligible", missing: [] };
  }
  if (filters.maxAge != null && (user.age as number) > filters.maxAge) {
    return { ok: false, reason: "ineligible", missing: [] };
  }
  if (filters.gender && user.gender !== filters.gender) {
    return { ok: false, reason: "ineligible", missing: [] };
  }

  return { ok: true };
}

/** Age limits for vote/comment/score — only when the poll sets min and/or max age. */
export function checkPollAgeEligibility(
  poll: { min_age?: number | null; max_age?: number | null },
  age: number | null | undefined,
): DemographicCheck {
  return checkAudienceEligibility(
    { minAge: poll.min_age ?? null, maxAge: poll.max_age ?? null },
    { age },
  );
}

export function resultsVisible(opts: {
  liveResultShares: boolean;
  endAt: Date;
  now?: Date;
}): boolean {
  const now = opts.now ?? new Date();
  if (opts.liveResultShares) return true;
  return now.getTime() >= opts.endAt.getTime();
}

export function pollIsOpen(opts: {
  startAt: Date;
  endAt: Date;
  status: string;
  deletedAt?: Date | null;
  now?: Date;
}): boolean {
  if (opts.status !== "published" || opts.deletedAt) return false;
  const now = opts.now ?? new Date();
  return (
    now.getTime() >= opts.startAt.getTime() &&
    now.getTime() < opts.endAt.getTime()
  );
}
