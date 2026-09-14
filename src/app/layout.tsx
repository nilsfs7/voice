import type { Metadata } from "next";
import { DM_Sans, Source_Serif_4 } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { readSessionUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Voice",
    template: "%s · Voice",
  },
  description: t().app.tagline,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await readSessionUser();
  const messages = t();

  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${sourceSerif.variable} antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header user={user} messages={messages} />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
            {children}
          </main>
          <Footer messages={messages} />
        </div>
      </body>
    </html>
  );
}
