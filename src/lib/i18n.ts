import en from "../../messages/en.json";

const messages = en;

export type Messages = typeof messages;

export function t(): Messages {
  return messages;
}

export function formatCount(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template,
  );
}
