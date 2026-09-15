import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { isVoiceAdmin } from "@/lib/capabilities";
import { execute, queryRows, withTransaction } from "@/lib/db/pool";

export type CommentRow = RowDataPacket & {
  id: number;
  poll_id: number;
  author_username: string;
  root_id: number | null;
  body: string | null;
  deleted_at: Date | null;
  created_at: Date;
  score?: number;
};

export class SelfScoreError extends Error {
  constructor(message = "cannot_score_own") {
    super(message);
    this.name = "SelfScoreError";
  }
}

export async function listComments(pollId: number): Promise<CommentRow[]> {
  return queryRows<CommentRow>(
    `SELECT c.*,
      (SELECT COALESCE(SUM(s.value), 0) FROM comment_scores s WHERE s.comment_id = c.id) AS score
     FROM comments c
     WHERE c.poll_id = ?
     ORDER BY c.created_at ASC`,
    [pollId],
  );
}

export async function createComment(input: {
  pollId: number;
  authorUsername: string;
  body: string;
  rootId?: number | null;
}): Promise<number> {
  return withTransaction(async (conn) => {
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO comments (poll_id, author_username, root_id, body)
       VALUES (?, ?, ?, ?)`,
      [
        input.pollId,
        input.authorUsername,
        input.rootId ?? null,
        input.body,
      ],
    );
    const commentId = result.insertId;
    // FR-CO-008: implicit author self-upvote so score starts at 1
    await conn.execute(
      `INSERT INTO comment_scores (comment_id, user_username, value)
       VALUES (?, ?, 1)`,
      [commentId, input.authorUsername],
    );
    return commentId;
  });
}

export async function softDeleteComment(input: {
  commentId: number;
  actorUsername: string;
  pollCreatorUsername: string;
}): Promise<boolean> {
  const rows = await queryRows<CommentRow>(
    `SELECT * FROM comments WHERE id = ? LIMIT 1`,
    [input.commentId],
  );
  const comment = rows[0];
  if (!comment || comment.deleted_at) return false;
  const allowed =
    isVoiceAdmin(input.actorUsername) ||
    comment.author_username === input.actorUsername ||
    input.pollCreatorUsername === input.actorUsername;
  if (!allowed) return false;
  const result = await execute(
    `UPDATE comments SET body = NULL, deleted_at = UTC_TIMESTAMP() WHERE id = ?`,
    [input.commentId],
  );
  return result.affectedRows > 0;
}

export async function upsertPollScore(
  pollId: number,
  username: string,
  value: 1 | -1,
  creatorUsername: string,
): Promise<void> {
  if (username === creatorUsername) {
    throw new SelfScoreError();
  }
  await execute(
    `INSERT INTO poll_scores (poll_id, user_username, value)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [pollId, username, value],
  );
}

export async function upsertCommentScore(
  commentId: number,
  username: string,
  value: 1 | -1,
  authorUsername: string,
): Promise<void> {
  if (username === authorUsername) {
    throw new SelfScoreError();
  }
  await execute(
    `INSERT INTO comment_scores (comment_id, user_username, value)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [commentId, username, value],
  );
}

export async function getComment(
  commentId: number,
): Promise<CommentRow | null> {
  const rows = await queryRows<CommentRow>(
    `SELECT * FROM comments WHERE id = ? LIMIT 1`,
    [commentId],
  );
  return rows[0] ?? null;
}
