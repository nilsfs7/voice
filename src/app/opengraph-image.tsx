import { ImageResponse } from "next/og";
import { messagesFor } from "@/lib/i18n/catalog";

export const alt = "Voice — community governance for freestyle football";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share image (TECH-15). English brand copy — stable for crawlers. */
export default function OpenGraphImage() {
  const { app } = messagesFor("en");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5f1",
          padding: "72px 80px",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            color: "#5c5a55",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#1d4ed8",
            }}
          />
          FSMeet
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#141414",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            {app.name}
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#5c5a55",
              lineHeight: 1.35,
              maxWidth: 900,
              fontFamily: "system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            {app.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#1d4ed8",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          voice.fsmeet.com
        </div>
      </div>
    ),
    { ...size },
  );
}
