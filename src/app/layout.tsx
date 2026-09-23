import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/components/I18nProvider";
import { readSessionUser } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/env";
import { dmSans, sourceSerif, voiceScript } from "@/lib/fonts";
import { getLocale, getMessages, localeMeta } from "@/lib/i18n";
import { absoluteUrl, toOpenGraphLocale } from "@/lib/seo/metadata";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  const locale = await getLocale();
  const title = messages.app.name;
  const description = messages.app.tagline;

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName: title,
      title,
      description,
      url: absoluteUrl("/"),
      locale: toOpenGraphLocale(locale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
