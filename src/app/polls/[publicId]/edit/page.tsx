import { notFound, redirect } from "next/navigation";
import { PollForm } from "@/components/PollForm";
import { canCreatePoll } from "@/lib/capabilities";
import { readSessionUser } from "@/lib/auth/session";
import { getVoiceMinAge } from "@/lib/env";
import { getOptions, getPollByPublicId } from "@/lib/polls/repository";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ publicId: string }> };

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditPollPage({ params }: Ctx) {
  const { publicId } = await params;
  const user = await readSessionUser();
  if (!user) redirect(`/api/auth/fsmeet/start?returnTo=/polls/${publicId}/edit`);
  if (!canCreatePoll(user.type)) redirect("/");

  const poll = await getPollByPublicId(publicId);
  if (!poll || poll.deleted_at || poll.creator_username !== user.username) {
    notFound();
  }
  if (poll.status !== "draft") redirect(`/polls/${publicId}`);

  const options = await getOptions(poll.id);
  const messages = t();
  const defaultMinAge = getVoiceMinAge();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="display text-4xl font-semibold">{messages.poll.edit}</h1>
      <PollForm
        mode="edit"
        publicId={publicId}
        defaultMinAge={defaultMinAge}
        initial={{
          question: poll.question,
          description: poll.description ?? "",
          alias: poll.alias ?? "",
          choiceMode: poll.choice_mode,
          liveResultShares: Boolean(poll.live_result_shares),
          countryCode: poll.country_code ?? "",
          continentalCode: poll.continental_code ?? "",
          minAge:
            poll.min_age != null ? String(poll.min_age) : String(defaultMinAge),
          maxAge: poll.max_age != null ? String(poll.max_age) : "",
          gender: poll.gender ?? "",
          startAt: toLocalInput(new Date(poll.start_at)),
          endAt: toLocalInput(new Date(poll.end_at)),
          options: options.map((o) => ({
            label: o.label,
            description: o.description ?? "",
          })),
        }}
      />
    </div>
  );
}
