import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { canCreatePoll } from "@/lib/capabilities";
import { isFsmeetOAuthConfigured } from "@/lib/auth/config";
import { voiceScript } from "@/lib/fonts";
import type { Messages } from "@/lib/i18n";
import { FsmeetProfileTrigger } from "@/components/FsmeetProfileTrigger";

export function Header({
  user,
  messages,
}: {
  user: SessionUser | null;
  messages: Messages;
}) {
  const oauthReady = isFsmeetOAuthConfigured();

  return (
    <header className="border-b border-border/80 bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className={`slogan-brand text-[1.85rem] leading-none text-accent sm:text-[2rem] ${voiceScript.className}`}
        >
          {messages.app.name}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 text-sm sm:gap-3">
          <Link href="/" className="muted hover:text-text px-2 py-1">
            {messages.nav.polls}
          </Link>
          {user ? (
            <Link href="/my-votes" className="muted hover:text-text px-2 py-1">
              {messages.nav.myVotes}
            </Link>
          ) : null}
          {user && canCreatePoll(user.type) ? (
            <Link href="/polls/new" className="btn btn-primary text-sm">
              {messages.nav.newPoll}
            </Link>
          ) : null}
          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <FsmeetProfileTrigger
                username={user.username}
                userType={user.type}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.imageUrl || "/avatar-fallback.svg"}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="fsmeet-profile-name hidden text-sm sm:inline">
                  {user.firstName} {user.lastName}
                </span>
              </FsmeetProfileTrigger>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="btn btn-secondary text-sm">
                  {messages.nav.logout}
                </button>
              </form>
            </div>
          ) : oauthReady ? (
            <Link
              href="/api/auth/fsmeet/start"
              className="btn btn-primary text-sm"
            >
              {messages.nav.login}
            </Link>
          ) : (
            <span className="muted text-xs">OAuth not configured</span>
          )}
        </nav>
      </div>
    </header>
  );
}
