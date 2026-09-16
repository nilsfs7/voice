import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/components/I18nProvider";
import { readSessionUser } from "@/lib/auth/session";
import { dmSans, sourceSerif, voiceScript } from "@/lib/fonts";
import { getLocale, getMessages, localeMeta } from "@/lib/i18n";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: {
      default: messages.app.name,
      template: `%s · ${messages.app.name}`,
    },
    description: messages.app.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await readSessionUser();
  const locale = await getLocale();
  const messages = await getMessages();
  const meta = localeMeta(locale);

  return (
    <html lang={locale} dir={meta.dir}>
      <body
        className={`${dmSans.variable} ${sourceSerif.variable} ${voiceScript.variable} antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header user={user} messages={messages} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
              {children}
            </main>
            <Footer messages={messages} />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
