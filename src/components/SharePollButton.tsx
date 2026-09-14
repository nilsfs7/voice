"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

export function SharePollButton({ url }: { url: string }) {
  const messages = t();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / denied permission
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn btn-primary" onClick={copy}>
        {messages.poll.share}
      </button>
      {copied ? (
        <span className="text-sm font-medium text-accent" role="status">
          {messages.poll.shareCopied}
        </span>
      ) : (
        <span className="text-sm text-text-muted">{messages.poll.shareHint}</span>
      )}
    </div>
  );
}
