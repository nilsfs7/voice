"use client";

import {
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { UserType } from "@/lib/capabilities";
import { fsmeetProfileUrl } from "@/lib/fsmeet/urls";
import { t } from "@/lib/i18n";

export function FsmeetProfileTrigger({
  username,
  userType,
  children,
  className = "",
}: {
  username: string;
  userType?: UserType | string | null;
  children: ReactNode;
  className?: string;
}) {
  const messages = t();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const yesRef = useRef<HTMLButtonElement>(null);
  const isAssociation = userType === "association";

  useEffect(() => {
    if (!open) return;
    yesRef.current?.focus();
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function openDialog(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!username) return;
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
  }

  function confirmYes() {
    window.location.assign(fsmeetProfileUrl(username));
  }

  return (
    <>
      <button
        type="button"
        className={`fsmeet-profile-trigger${isAssociation ? " is-association" : ""} ${className}`.trim()}
        onClick={openDialog}
        aria-haspopup="dialog"
        aria-label={
          isAssociation
            ? `${messages.profile.association}: ${messages.profile.viewOnFsmeet}`
            : messages.profile.viewOnFsmeet
        }
      >
        {children}
        {isAssociation ? (
          <span className="association-badge">{messages.profile.association}</span>
        ) : null}
      </button>

      {open ? (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={closeDialog}
        >
          <div
            className="dialog-panel card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <p id={titleId} className="dialog-title">
              {messages.profile.viewOnFsmeet}
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeDialog}
              >
                {messages.profile.no}
              </button>
              <button
                ref={yesRef}
                type="button"
                className="btn btn-primary"
                onClick={confirmYes}
              >
                {messages.profile.yes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
