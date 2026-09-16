import Link from "next/link";
import { FaGithub, FaInstagram } from "react-icons/fa";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getFsmeetFrontendUrl } from "@/lib/env";
import type { Messages } from "@/lib/i18n/catalog";

export function Footer({ messages }: { messages: Messages }) {
  const fsmeet = getFsmeetFrontendUrl();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={fsmeet}
            className="text-sm font-medium text-text-muted hover:text-text"
            target="_blank"
            rel="noreferrer"
          >
            {messages.app.poweredBy}
          </Link>
          <div className="flex items-center gap-4 text-text-muted">
            <LanguageSwitcher />
            <a
              href="https://www.instagram.com/fsmeet_com"
              target="_blank"
              rel="noreferrer"
              aria-label="FSMeet Instagram"
              className="hover:text-text"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="https://github.com/nilsfs7/voice"
              target="_blank"
              rel="noreferrer"
              aria-label="Voice GitHub repository"
              className="hover:text-text"
            >
              <FaGithub size={20} />
            </a>
          </div>
        </div>

        <div className="grid gap-6 text-sm sm:grid-cols-3">
          <div>
            <div className="mb-2 font-semibold">{messages.nav.otherTools}</div>
            <ul className="space-y-2 text-text-muted">
              <li>
                <a
                  href="https://www.freestyleacts.com/en"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text"
                >
                  {messages.tools.freestyleActs}
                </a>
              </li>
              <li>
                <a
                  href="https://fsmeet.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text"
                >
                  {messages.tools.fsmeet}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-semibold">{messages.nav.legal}</div>
            <ul className="space-y-2 text-text-muted">
              <li>
                <Link href="/faq" className="hover:text-text">
                  {messages.nav.faq}
                </Link>
              </li>
              <li>
                <Link href="/imprint" className="hover:text-text">
                  {messages.nav.imprint}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-text">
                  {messages.nav.privacy}
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-text-muted">{messages.app.officialBlurb}</div>
        </div>
      </div>
    </footer>
  );
}
