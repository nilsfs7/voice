"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useI18n } from "@/components/I18nProvider";
import { LOCALES, localeMeta, type Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = localeMeta(locale);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  async function onChange(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      ref={rootRef}
      className={`lang-picker ${open ? "is-open" : ""} ${className}`.trim()}
    >
      <button
        type="button"
        className="lang-picker-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${messages.nav.language}: ${current.label}`}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="lang-picker-flag" aria-hidden>
          {current.flag}
        </span>
      </button>
      {open ? (
        <ul id={listId} className="lang-picker-menu" role="listbox">
          {LOCALES.map((item) => (
            <li key={item.code} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={item.code === locale}
                className={`lang-picker-option${item.code === locale ? " is-active" : ""}`}
                onClick={() => onChange(item.code)}
              >
                <span className="lang-picker-flag" aria-hidden>
                  {item.flag}
                </span>
                <span className="lang-picker-code">{item.product}</span>
                <span className="lang-picker-name">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
