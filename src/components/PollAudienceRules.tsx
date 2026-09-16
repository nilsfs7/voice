import { formatCount } from "@/lib/i18n/catalog";
import { getMessages } from "@/lib/i18n/server";

type PollAudienceRulesProps = {
  countryCode?: string | null;
  continentalCode?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  gender?: "male" | "female" | null;
};

export async function PollAudienceRules({
  countryCode,
  continentalCode,
  minAge,
  maxAge,
  gender,
}: PollAudienceRulesProps) {
  const messages = await getMessages();
  const rules: string[] = [];

  if (countryCode) {
    rules.push(
      formatCount(messages.poll.ruleCountry, { code: countryCode.toUpperCase() }),
    );
  }
  if (continentalCode) {
    rules.push(
      formatCount(messages.poll.ruleContinent, {
        code: continentalCode.toUpperCase(),
      }),
    );
  }
  if (minAge != null && maxAge != null) {
    rules.push(
      formatCount(messages.poll.ruleAgeRange, { min: minAge, max: maxAge }),
    );
  } else if (minAge != null) {
    rules.push(formatCount(messages.poll.ruleAgeMin, { age: minAge }));
  } else if (maxAge != null) {
    rules.push(formatCount(messages.poll.ruleAgeMax, { age: maxAge }));
  }
  if (gender === "male") rules.push(messages.poll.ruleGenderMale);
  if (gender === "female") rules.push(messages.poll.ruleGenderFemale);

  if (rules.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {messages.poll.rulesTitle}
      </p>
      <ul className="flex flex-wrap gap-2">
        {rules.map((rule) => (
          <li
            key={rule}
            className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-text-muted"
          >
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}
