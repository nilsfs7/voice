import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { customAlphabet } from "nanoid";
import { execute, queryRows, withTransaction } from "@/lib/db/pool";
import { isValidAlias, normalizeAlias } from "@/lib/polls/alias";

const publicId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12,
);

export type PollRow = RowDataPacket & {
  id: number;
  public_id: string;
  alias: string | null;
  creator_username: string;
  question: string;
  description: string | null;
  choice_mode: "single" | "multiple";
  status: "draft" | "published";
  live_result_shares: number;
  country_code: string | null;
  continental_code: string | null;
  min_age: number | null;
  max_age: number | null;
  gender: "male" | "female" | null;
  start_at: Date;
  end_at: Date;
  published_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  total_votes?: number;
  total_comments?: number;
  score?: number;
};

export type OptionRow = RowDataPacket & {
  id: number;
  poll_id: number;
  label: string;
  description: string | null;
  sort_order: number;
};

export type CreatePollInput = {
  creatorUsername: string;
  question: string;
  description?: string | null;
  alias?: string | null;
  choiceMode: "single" | "multiple";
  liveResultShares: boolean;
  countryCode?: string | null;
  continentalCode?: string | null;
  minAge?: number | null;
  maxAge?: number | null;
  gender?: "male" | "female" | null;
  startAt: Date;
  endAt: Date;
  options: { label: string; description?: string | null }[];
};

export class AliasConflictError extends Error {
  constructor(message = "alias_taken") {
    super(message);
    this.name = "AliasConflictError";
  }
}

export class InvalidAliasError extends Error {
  constructor(message = "invalid_alias") {
    super(message);
    this.name = "InvalidAliasError";
  }
}

async function assertAliasAvailable(
  conn: PoolConnection,
  alias: string | null,
  excludePollId?: number,
): Promise<void> {
  if (!alias) return;
  if (!isValidAlias(alias)) throw new InvalidAliasError();

  const [byAlias] = await conn.execute<PollRow[]>(
    `SELECT id, public_id FROM polls
     WHERE alias = ? AND deleted_at IS NULL
     ${excludePollId != null ? "AND id <> ?" : ""}
     LIMIT 1`,
    excludePollId != null ? [alias, excludePollId] : [alias],
  );
  if (byAlias[0]) throw new AliasConflictError();

  const [byPublicId] = await conn.execute<PollRow[]>(
    `SELECT id FROM polls WHERE public_id = ? AND deleted_at IS NULL LIMIT 1`,
    [alias],
  );
  if (byPublicId[0] && byPublicId[0].id !== excludePollId) {
    throw new AliasConflictError();
  }
}

function prepareAlias(raw: string | null | undefined): string | null {
  const alias = normalizeAlias(raw);
  if (alias && !isValidAlias(alias)) throw new InvalidAliasError();
  return alias;
}

function trimOrNull(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length ? trimmed : null;
}

/** TECH-13: trim poll info and options before DB write. */
function normalizePollWriteInput(
  input: Omit<CreatePollInput, "creatorUsername">,
): {
  question: string;
  description: string | null;
  choiceMode: "single" | "multiple";
  liveResultShares: boolean;
  countryCode: string | null;
  continentalCode: string | null;
  minAge: number | null;
  maxAge: number | null;
  gender: "male" | "female" | null;
  startAt: Date;
  endAt: Date;
  options: { label: string; description: string | null }[];
} {
  return {
    question: input.question.trim(),
    description: trimOrNull(input.description),
    choiceMode: input.choiceMode,
    liveResultShares: input.liveResultShares,
    countryCode: trimOrNull(input.countryCode),
    continentalCode: trimOrNull(input.continentalCode),
    minAge: input.minAge ?? null,
    maxAge: input.maxAge ?? null,
    gender: input.gender ?? null,
    startAt: input.startAt,
    endAt: input.endAt,
    options: input.options.map((option) => ({
      label: option.label.trim(),
      description: trimOrNull(option.description),
    })),
  };
}

export async function createPoll(input: CreatePollInput): Promise<{
  publicId: string;
  alias: string | null;
}> {
  const normalized = normalizePollWriteInput(input);
  const alias = prepareAlias(input.alias);
  return withTransaction(async (conn) => {
    await assertAliasAvailable(conn, alias);
    const id = publicId();
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO polls (
        public_id, alias, creator_username, question, description, choice_mode,
        live_result_shares, country_code, continental_code, min_age, max_age,
        gender, start_at, end_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        id,
        alias,
        input.creatorUsername,
        normalized.question,
        normalized.description,
        normalized.choiceMode,
        normalized.liveResultShares ? 1 : 0,
        normalized.countryCode,
        normalized.continentalCode,
        normalized.minAge,
        normalized.maxAge,
        normalized.gender,
        normalized.startAt,
        normalized.endAt,
      ],
    );
    const pollId = result.insertId;
    for (const [index, option] of normalized.options.entries()) {
      await conn.execute(
        `INSERT INTO poll_options (poll_id, label, description, sort_order)
         VALUES (?, ?, ?, ?)`,
        [pollId, option.label, option.description, index],
      );
    }
    // FR-PO-031: implicit creator self-upvote so score starts at 1
    await conn.execute(
      `INSERT INTO poll_scores (poll_id, user_username, value) VALUES (?, ?, 1)`,
      [pollId, input.creatorUsername],
    );
    return { publicId: id, alias };
  });
}

export async function updateDraftPoll(
  slug: string,
  creatorUsername: string,
  input: Omit<CreatePollInput, "creatorUsername">,
): Promise<boolean> {
  const normalized = normalizePollWriteInput(input);
  const alias = prepareAlias(input.alias);
  return withTransaction(async (conn) => {
    const [rows] = await conn.execute<PollRow[]>(
      `SELECT * FROM polls
       WHERE (public_id = ? OR alias = ?) AND creator_username = ? AND deleted_at IS NULL
       LIMIT 1`,
      [slug, slug, creatorUsername],
    );
    const poll = rows[0];
    if (!poll || poll.status !== "draft") return false;

    await assertAliasAvailable(conn, alias, poll.id);

    await conn.execute(
      `UPDATE polls SET
        alias = ?, question = ?, description = ?, choice_mode = ?, live_result_shares = ?,
        country_code = ?, continental_code = ?, min_age = ?, max_age = ?,
        gender = ?, start_at = ?, end_at = ?
       WHERE id = ? AND status = 'draft'`,
      [
        alias,
        normalized.question,
        normalized.description,
        normalized.choiceMode,
        normalized.liveResultShares ? 1 : 0,
        normalized.countryCode,
        normalized.continentalCode,
        normalized.minAge,
        normalized.maxAge,
        normalized.gender,
        normalized.startAt,
        normalized.endAt,
        poll.id,
      ],
    );
    await conn.execute(`DELETE FROM poll_options WHERE poll_id = ?`, [poll.id]);
    for (const [index, option] of normalized.options.entries()) {
      await conn.execute(
        `INSERT INTO poll_options (poll_id, label, description, sort_order)
         VALUES (?, ?, ?, ?)`,
        [poll.id, option.label, option.description, index],
      );
    }
    return true;
  });
}

export async function publishPoll(
  slug: string,
  creatorUsername: string,
): Promise<boolean> {
  const result = await execute(
    `UPDATE polls SET status = 'published', published_at = UTC_TIMESTAMP()
     WHERE (public_id = ? OR alias = ?) AND creator_username = ?
       AND status = 'draft' AND deleted_at IS NULL`,
    [slug, slug, creatorUsername],
  );
  return result.affectedRows > 0;
}

export async function softDeletePoll(
  slug: string,
  creatorUsername: string,
): Promise<boolean> {
  const result = await execute(
    `UPDATE polls SET deleted_at = UTC_TIMESTAMP()
     WHERE (public_id = ? OR alias = ?) AND creator_username = ? AND deleted_at IS NULL`,
    [slug, slug, creatorUsername],
  );
  return result.affectedRows > 0;
}

/** Resolve by opaque public_id or optional unique alias. */
export async function getPollByPublicId(
  slug: string,
): Promise<PollRow | null> {
  const rows = await queryRows<PollRow>(
    `SELECT p.*,
      (SELECT COUNT(*) FROM ballots b WHERE b.poll_id = p.id) AS total_votes,
      (SELECT COALESCE(SUM(s.value), 0) FROM poll_scores s WHERE s.poll_id = p.id) AS score
     FROM polls p
     WHERE p.public_id = ? OR p.alias = ?
     LIMIT 1`,
    [slug, slug],
  );
  return rows[0] ?? null;
}

export async function listPolls(opts: {
  sort?: "created_at" | "end_at" | "score";
  creator?: string | null;
  viewerUsername?: string | null;
}): Promise<PollRow[]> {
  // Use a joined aggregate for score — ORDER BY select-list aliases is unreliable
  // with mysql2 prepared statements (`execute`), which can ignore the alias.
  const orderBy =
    opts.sort === "end_at"
      ? "p.end_at ASC, p.created_at DESC"
      : opts.sort === "score"
        ? "COALESCE(sc.score_sum, 0) DESC, p.created_at DESC"
        : "p.created_at DESC";

  const params: Array<string | number | boolean | Date | null> = [];
  let where = `p.deleted_at IS NULL AND (
    p.status = 'published'
    ${opts.viewerUsername ? "OR (p.status = 'draft' AND p.creator_username = ?)" : ""}
  )`;
  if (opts.viewerUsername) params.push(opts.viewerUsername);
  if (opts.creator) {
    where += ` AND p.creator_username = ?`;
    params.push(opts.creator);
  }

  const rows = await queryRows<PollRow>(
    `SELECT p.*,
      (SELECT COUNT(*) FROM ballots b WHERE b.poll_id = p.id) AS total_votes,
      (SELECT COUNT(*) FROM comments c
        WHERE c.poll_id = p.id AND c.deleted_at IS NULL) AS total_comments,
      COALESCE(sc.score_sum, 0) AS score
     FROM polls p
     LEFT JOIN (
       SELECT poll_id, SUM(value) AS score_sum
       FROM poll_scores
       GROUP BY poll_id
     ) sc ON sc.poll_id = p.id
     WHERE ${where}
     ORDER BY ${orderBy}`,
    params,
  );

  // Guarantee numeric importance order even if the driver returns score as a string.
  if (opts.sort === "score") {
    rows.sort((a, b) => {
      const scoreDiff = Number(b.score ?? 0) - Number(a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  return rows;
}

export async function getOptions(pollId: number): Promise<OptionRow[]> {
  return queryRows<OptionRow>(
    `SELECT * FROM poll_options WHERE poll_id = ? ORDER BY sort_order ASC, id ASC`,
    [pollId],
  );
}

/** Distinct creators of non-deleted polls (published, plus viewer's drafts when provided). */
export async function listPollCreatorUsernames(opts?: {
  viewerUsername?: string | null;
}): Promise<string[]> {
  const params: Array<string | number | boolean | Date | null> = [];
  let where = `deleted_at IS NULL AND (
    status = 'published'
    ${opts?.viewerUsername ? "OR (status = 'draft' AND creator_username = ?)" : ""}
  )`;
  if (opts?.viewerUsername) params.push(opts.viewerUsername);

  const rows = await queryRows<RowDataPacket & { creator_username: string }>(
    `SELECT DISTINCT creator_username
     FROM polls
     WHERE ${where}
     ORDER BY creator_username ASC`,
    params,
  );
  return rows.map((r) => r.creator_username);
}

/** Published polls for SEO sitemap (TECH-11). */
export async function listPublishedPollsForSitemap(): Promise<
  Pick<PollRow, "public_id" | "alias" | "updated_at" | "published_at">[]
> {
  return queryRows<
    PollRow & Pick<PollRow, "public_id" | "alias" | "updated_at" | "published_at">
  >(
    `SELECT public_id, alias, updated_at, published_at
     FROM polls
     WHERE status = 'published' AND deleted_at IS NULL
     ORDER BY COALESCE(published_at, created_at) DESC`,
  );
}
