import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileGateNotice } from "@/components/ProfileGateNotice";
import { PollForm } from "@/components/PollForm";
import { getFsmeetAccessToken, readSessionUser } from "@/lib/auth/session";
import {
  canCreatePoll,
  checkCreatePollTrustGate,
} from "@/lib/capabilities";
import { getVoiceMinAge } from "@/lib/env";
import { fetchFsmeetUser } from "@/lib/fsmeet/users";
import { getMessages } from "@/lib/i18n";
import { NOINDEX_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default async function NewPollPage() {
  const user = await readSessionUser();
  if (!user) redirect("/api/auth/fsmeet/start?returnTo=/polls/new");
  if (!canCreatePoll(user.type)) redirect("/");

  const accessToken = await getFsmeetAccessToken();
  const profile = await fetchFsmeetUser(user.username, accessToken);
  const trust = profile
    ? checkCreatePollTrustGate(profile)
    : ({
        ok: false as const,
        reason: "missing_fields" as const,
        missing: ["verified account"],
      });

  const messages = await getMessages();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="display text-4xl font-semibold">{messages.nav.newPoll}</h1>
      {trust.ok ? (
        <PollForm mode="create" defaultMinAge={getVoiceMinAge()} />
      ) : (
        <ProfileGateNotice missing={trust.missing} purpose="create" />
      )}
    </div>
  );
}
