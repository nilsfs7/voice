import { t } from "@/lib/i18n";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  const messages = t();
  return (
    <article className="prose-voice mx-auto max-w-3xl space-y-8">
      <h1 className="display text-4xl font-semibold">{messages.nav.faq}</h1>
      <FaqItem title="What is Voice?">
        Voice is the official community governance tool for freestyle football
        within FSMeet. It lets the scene create polls, discuss them, and vote so
        decisions are visible and shared. Outcomes are not enforced by the
        software — whether the community acts on a result is up to the community.
      </FaqItem>
      <FaqItem title="Who can create a poll?">
        FSMeet users with type association, dj, freestyler, event_organizer, mc,
        or media — and a WFFA ID or a verified FSMeet account.
      </FaqItem>
      <FaqItem title="Who can vote?">
        FSMeet users with type dj, freestyler, event_organizer, mc, or media.
        You must sign in with your FSMeet account, and have at least one of: WFFA
        ID, verified account, Instagram handle, TikTok handle, or YouTube handle
        on your FSMeet profile. If the poll sets age filters, you must meet them
        to vote.
      </FaqItem>
      <FaqItem title="Who can comment?">
        Any signed-in FSMeet user type. If the poll sets age filters, you must
        meet them to comment — except the poll creator, who may always comment
        on their own poll regardless of audience filters.
      </FaqItem>
      <FaqItem title="What is Abstention?">
        Abstention records that you participated without choosing an answer
        option. You cannot combine it with other options. It counts toward total
        votes and appears in result charts.
      </FaqItem>
      <FaqItem title="Can I change my vote?">
        Yes, until the poll’s end date. After it expires, your answer is locked.
      </FaqItem>
      <FaqItem title="What is My votes?">
        A personal list of every poll you took part in and the answer you gave
        (including abstentions).
      </FaqItem>
    </article>
  );
}

function FaqItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card space-y-2 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="leading-relaxed text-text-muted">{children}</p>
    </section>
  );
}
