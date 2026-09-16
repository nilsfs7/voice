"use client";

import { createContext, useContext } from "react";
import { messagesFor, type Messages } from "@/lib/i18n/catalog";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

type I18nValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  messages: messagesFor(DEFAULT_LOCALE),
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

export function useMessages(): Messages {
  return useContext(I18nContext).messages;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}
