import { Dancing_Script, DM_Sans, Source_Serif_4 } from "next/font/google";

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

/** Script for the “Voice” wordmark (slogan + header). */
export const voiceScript = Dancing_Script({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-voice-script",
});
