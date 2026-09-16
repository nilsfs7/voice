import { getMessages } from "@/lib/i18n";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const messages = await getMessages();
  const items = [
    { title: messages.faq.whatIsTitle, body: messages.faq.whatIsBody },
    { title: messages.faq.whoCreateTitle, body: messages.faq.whoCreateBody },
    { title: messages.faq.whoVoteTitle, body: messages.faq.whoVoteBody },
    { title: messages.faq.whoCommentTitle, body: messages.faq.whoCommentBody },
    { title: messages.faq.abstentionTitle, body: messages.faq.abstentionBody },
    { title: messages.faq.changeVoteTitle, body: messages.faq.changeVoteBody },
    { title: messages.faq.myVotesTitle, body: messages.faq.myVotesBody },
  ];

  return (
    <article className="prose-voice mx-auto max-w-3xl space-y-8">
      <h1 className="display text-4xl font-semibold">{messages.nav.faq}</h1>
      {items.map((item) => (
        <FaqItem key={item.title} title={item.title}>
          {item.body}
        </FaqItem>
      ))}
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
