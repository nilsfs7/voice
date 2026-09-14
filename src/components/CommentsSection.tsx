"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FsmeetProfileTrigger } from "@/components/FsmeetProfileTrigger";
import { t } from "@/lib/i18n";

type Comment = {
  id: number;
  authorUsername: string;
  rootId: number | null;
  body: string | null;
  deleted: boolean;
  createdAt: string;
  score: number;
  author?: {
    firstName: string;
    lastName: string;
    imageUrl: string;
    type?: string;
  };
};

export function CommentsSection({
  publicId,
  initial,
  loggedIn,
  canScore,
  currentUsername,
  pollCreatorUsername,
  ageGate,
}: {
  publicId: string;
  initial: Comment[];
  loggedIn: boolean;
  canScore: boolean;
  currentUsername?: string;
  pollCreatorUsername: string;
  ageGate?: { ok: true } | { ok: false; reason: string; missing: string[] };
}) {
  const messages = t();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roots = useMemo(
    () => initial.filter((c) => !c.rootId),
    [initial],
  );
  const replies = useMemo(() => {
    const map = new Map<number, Comment[]>();
    for (const comment of initial) {
      if (!comment.rootId) continue;
      const list = map.get(comment.rootId) ?? [];
      list.push(comment);
      map.set(comment.rootId, list);
    }
    return map;
  }, [initial]);

  async function post() {
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/polls/${publicId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, rootId: replyTo }),
    });
    setPending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        missing?: string[];
      };
      if (data.error === "missing_fields") {
        setError(
          messages.poll.missingProfile.replace(
            "{fields}",
            (data.missing ?? []).join(", "),
          ),
        );
      } else if (data.error === "ineligible") {
        setError(messages.poll.ineligible);
      } else {
        setError(data.error || "Could not post comment");
      }
      return;
    }
    setBody("");
    setReplyTo(null);
    router.refresh();
  }

  async function remove(commentId: number) {
    await fetch(`/api/polls/${publicId}/comments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
    router.refresh();
  }

  async function score(commentId: number, value: 1 | -1) {
    await fetch(`/api/polls/${publicId}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, value }),
    });
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <h2 className="display text-2xl font-semibold">{messages.comments.title}</h2>

      {loggedIn ? (
        ageGate && !ageGate.ok ? (
          <div className="card space-y-3 p-4">
            <p className="text-sm text-danger">
              {ageGate.reason === "missing_fields"
                ? messages.poll.missingProfile.replace(
                    "{fields}",
                    ageGate.missing.join(", "),
                  )
                : messages.poll.ineligible}
            </p>
            {ageGate.reason === "missing_fields" ? (
              <a
                className="btn btn-secondary"
                href="https://fsmeet.com/account"
                target="_blank"
                rel="noreferrer"
              >
                {messages.poll.updateProfile}
              </a>
            ) : null}
          </div>
        ) : (
          <div className="card space-y-3 p-4">
            {replyTo ? (
              <p className="text-sm text-text-muted">
                Replying to comment #{replyTo}{" "}
                <button className="underline" onClick={() => setReplyTo(null)}>
                  Cancel
                </button>
              </p>
            ) : null}
            <textarea
              className="field min-h-24"
              placeholder={messages.comments.placeholder}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button className="btn btn-primary" disabled={pending} onClick={post}>
              {messages.comments.post}
            </button>
          </div>
        )
      ) : (
        <p className="text-sm text-text-muted">{messages.poll.loginToInteract}</p>
      )}

      {roots.length === 0 ? (
        <p className="text-sm text-text-muted">{messages.comments.empty}</p>
      ) : null}

      <div className="space-y-4">
        {roots.map((comment) => (
          <article key={comment.id} className="card space-y-3 p-4">
            <CommentBody
              comment={comment}
              messages={messages}
              canScore={
                canScore && currentUsername !== comment.authorUsername
              }
              canDelete={
                currentUsername === comment.authorUsername ||
                currentUsername === pollCreatorUsername
              }
              onReply={() => setReplyTo(comment.id)}
              onDelete={() => remove(comment.id)}
              onScore={score}
            />
            <div className="space-y-3 border-l border-border pl-4">
              {(replies.get(comment.id) ?? []).map((reply) => (
                <CommentBody
                  key={reply.id}
                  comment={reply}
                  messages={messages}
                  canScore={
                    canScore && currentUsername !== reply.authorUsername
                  }
                  canDelete={
                    currentUsername === reply.authorUsername ||
                    currentUsername === pollCreatorUsername
                  }
                  onDelete={() => remove(reply.id)}
                  onScore={score}
                />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CommentBody({
  comment,
  messages,
  canScore,
  canDelete,
  onReply,
  onDelete,
  onScore,
}: {
  comment: Comment;
  messages: ReturnType<typeof t>;
  canScore: boolean;
  canDelete: boolean;
  onReply?: () => void;
  onDelete: () => void;
  onScore: (id: number, value: 1 | -1) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <FsmeetProfileTrigger
          username={comment.authorUsername}
          userType={comment.author?.type}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={comment.author?.imageUrl || "/avatar-fallback.svg"}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
          <span className="fsmeet-profile-name">
            {comment.author
              ? `${comment.author.firstName} ${comment.author.lastName}`
              : comment.authorUsername}
          </span>
        </FsmeetProfileTrigger>
        <span>·</span>
        <span>{new Date(comment.createdAt).toLocaleString("en-GB")}</span>
      </div>
      <p className="text-[15px] leading-relaxed">
        {comment.deleted ? (
          <em className="text-text-muted">{messages.comments.deleted}</em>
        ) : (
          comment.body
        )}
      </p>
      <div className="flex flex-wrap gap-2 text-sm">
        {canScore && !comment.deleted ? (
          <>
            <button className="btn btn-secondary px-3 py-1" onClick={() => onScore(comment.id, 1)}>
              ▲ {comment.score}
            </button>
            <button className="btn btn-secondary px-3 py-1" onClick={() => onScore(comment.id, -1)}>
              ▼
            </button>
          </>
        ) : (
          <span className="muted">Score {comment.score}</span>
        )}
        {onReply && !comment.deleted ? (
          <button className="btn btn-secondary px-3 py-1" onClick={onReply}>
            {messages.comments.reply}
          </button>
        ) : null}
        {canDelete && !comment.deleted ? (
          <button className="btn btn-danger px-3 py-1" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}
