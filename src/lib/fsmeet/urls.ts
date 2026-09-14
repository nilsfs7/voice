import { getFsmeetFrontendUrl } from "@/lib/env";

/** Public FSMeet profile page for a username. */
export function fsmeetProfileUrl(username: string): string {
  return `${getFsmeetFrontendUrl()}/users/${encodeURIComponent(username)}`;
}
