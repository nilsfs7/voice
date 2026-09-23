import { JsonLd } from "@/components/JsonLd";
import { getMessages } from "@/lib/i18n";
import { faqItems, faqPageJsonLd } from "@/lib/seo/json-ld";

export const metadata = { title: "FAQ" };

export default async function FaqPage() {
  const messages = await getMessages();
  const items = faqItems(messages);

  return (
    <article className="prose-voice mx-auto max-w-3xl space-y-8">
      <JsonLd data={faqPageJsonLd(items)} />
      <h1 className="display text-4xl font-semibold">{messages.nav.faq}</h1>
      {items.map((item) => (
        <FaqItem key={item.question} title={item.question}>
          {item.answer}
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
