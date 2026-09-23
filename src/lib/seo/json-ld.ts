import type { Messages } from "@/lib/i18n/catalog";
import { absoluteUrl } from "@/lib/seo/metadata";

const ORGANIZATION_SAME_AS = [
  "https://www.instagram.com/fsmeet_com",
  "https://github.com/nilsfs7/voice",
  "https://fsmeet.com/",
] as const;

/** FAQ Q/A pairs shared by the FAQ page UI and FAQPage JSON-LD. */
export function faqItems(messages: Messages): { question: string; answer: string }[] {
  return [
    { question: messages.faq.whatIsTitle, answer: messages.faq.whatIsBody },
    { question: messages.faq.whoCreateTitle, answer: messages.faq.whoCreateBody },
    { question: messages.faq.whoVoteTitle, answer: messages.faq.whoVoteBody },
    {
      question: messages.faq.whoCommentTitle,
      answer: messages.faq.whoCommentBody,
    },
    {
      question: messages.faq.abstentionTitle,
      answer: messages.faq.abstentionBody,
    },
    {
      question: messages.faq.changeVoteTitle,
      answer: messages.faq.changeVoteBody,
    },
    { question: messages.faq.myVotesTitle, answer: messages.faq.myVotesBody },
  ];
}

/** WebSite + Organization graph for the home page (TECH-19). */
export function websiteOrganizationGraph(opts: {
  name: string;
  description: string;
}): Record<string, unknown> {
  const url = absoluteUrl("/");
  const orgId = `${url}/#organization`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: opts.name,
        url,
        description: opts.description,
        publisher: { "@id": orgId },
      },
      {
        "@type": "Organization",
        "@id": orgId,
        name: opts.name,
        url,
        description: opts.description,
        sameAs: [...ORGANIZATION_SAME_AS],
      },
    ],
  };
}

/** FAQPage schema matching visible FAQ copy (TECH-19). */
export function faqPageJsonLd(
  items: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl("/faq"),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * Poll as schema.org Question (TECH-19).
 * Do not invent acceptedAnswer from vote tallies.
 */
export function pollQuestionJsonLd(opts: {
  name: string;
  text?: string | null;
  url: string;
  dateCreated: Date | string;
  dateModified: Date | string;
  authorName?: string | null;
  authorUrl?: string | null;
}): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: opts.name,
    url: opts.url,
    dateCreated: toIso(opts.dateCreated),
    dateModified: toIso(opts.dateModified),
  };

  const text = opts.text?.trim();
  if (text) data.text = text;

  const authorName = opts.authorName?.trim();
  if (authorName) {
    const author: Record<string, unknown> = {
      "@type": "Person",
      name: authorName,
    };
    if (opts.authorUrl) author.url = opts.authorUrl;
    data.author = author;
  }

  return data;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
