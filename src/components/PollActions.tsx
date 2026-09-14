"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";

export function PollActions({
  publicId,
  status,
  canEdit,
}: {
  publicId: string;
  status: "draft" | "published";
  canEdit: boolean;
}) {
  const messages = t();
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
      {status === "draft" ? (
        <button className="btn btn-primary text-sm" onClick={publish}>
          {messages.poll.publish}
        </button>
      ) : null}
      {canEdit ? (
        <Link href={`/polls/${publicId}/edit`} className="btn btn-secondary text-sm">
          {messages.poll.edit}
        </Link>
      ) : null}
      <button className="btn btn-danger text-sm" onClick={remove}>
        {messages.poll.delete}
      </button>
    </div>
  );
}
