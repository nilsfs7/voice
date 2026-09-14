import { canCreatePoll } from "@/lib/capabilities";
import { readSessionUser } from "@/lib/auth/session";
import { getVoiceMinAge } from "@/lib/env";
import { redirect } from "next/navigation";
import { PollForm } from "@/components/PollForm";
import { t } from "@/lib/i18n";

export default async function NewPollPage() {
  const user = await readSessionUser();
  if (!user) redirect("/api/auth/fsmeet/start?returnTo=/polls/new");
  if (!canCreatePoll(user.type)) redirect("/");
  const messages = t();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="display text-4xl font-semibold">{messages.nav.newPoll}</h1>
      <PollForm mode="create" defaultMinAge={getVoiceMinAge()} />
    </div>
  );
}
