"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMessages } from "@/components/I18nProvider";

export function PollActions({
  publicId,
  status,
  canEdit,
  canPublish = true,
  canDelete = true,
}: {
  publicId: string;
  status: "draft" | "published";
  canEdit: boolean;
  /** Creator-only publish (admin soft-delete does not imply publish). */
  canPublish?: boolean;
  canDelete?: boolean;
}) {
  const messages = useMessages();
  const router = useRouter();

  async function publish() {
    await fetch(`/api/polls/${publicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish" }),
    });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this poll?")) return;
    await fetch(`/api/polls/${publicId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "draft" && canPublish ? (
        <button className="btn btn-primary text-sm" onClick={publish}>
          {messages.poll.publish}
        </button>
      ) : null}
      {canEdit ? (
        <Link href={`/polls/${publicId}/edit`} className="btn btn-secondary text-sm">
          {messages.poll.edit}
        </Link>
      ) : null}
      {canDelete ? (
        <button className="btn btn-danger text-sm" onClick={remove}>
          {messages.poll.delete}
        </button>
      ) : null}
    </div>
  );
}
