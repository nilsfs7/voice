import { DM_Sans, Kaushan_Script, Source_Serif_4 } from "next/font/google";

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

/**
 * Confident brush script for the “Voice” wordmark (slogan + header).
 * Swung enough to feel personal, bold enough to feel like a real voice.
 */
export const voiceScript = Kaushan_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-voice-script",
});
