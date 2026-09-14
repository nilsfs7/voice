import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { withTransaction } from "@/lib/db/pool";
import { queryRows } from "@/lib/db/pool";

export type BallotRow = RowDataPacket & {
  id: number;
  poll_id: number;
  voter_username: string;
  is_abstention: number;
  voter_age: number | null;
  voter_gender: "male" | "female" | null;
};

export async function getBallot(
  pollId: number,
  username: string,
): Promise<{ ballot: BallotRow; optionIds: number[] } | null> {
  const rows = await queryRows<BallotRow>(
    `SELECT * FROM ballots WHERE poll_id = ? AND voter_username = ? LIMIT 1`,
    [pollId, username],
  );
  const ballot = rows[0];
  if (!ballot) return null;
  const selections = await queryRows<RowDataPacket & { option_id: number }>(
    `SELECT option_id FROM ballot_selections WHERE ballot_id = ?`,
    [ballot.id],
  );
  return {
    ballot,
    optionIds: selections.map((s) => s.option_id),
  };
}

export async function upsertBallot(input: {
  pollId: number;
  username: string;
  isAbstention: boolean;
  optionIds: number[];
  voterAge: number | null;
  voterGender: "male" | "female" | null;
}): Promise<void> {
  await withTransaction(async (conn) => {
    const [existing] = await conn.execute<BallotRow[]>(
      `SELECT * FROM ballots WHERE poll_id = ? AND voter_username = ? LIMIT 1`,
      [input.pollId, input.username],
    );
    let ballotId = existing[0]?.id;
    if (ballotId) {
      await conn.execute(
        `UPDATE ballots SET is_abstention = ?, voter_age = ?, voter_gender = ?
         WHERE id = ?`,
        [
          input.isAbstention ? 1 : 0,
          input.voterAge,
          input.voterGender,
          ballotId,
        ],
      );
      await conn.execute(`DELETE FROM ballot_selections WHERE ballot_id = ?`, [
        ballotId,
      ]);
    } else {
      const [result] = await conn.execute<ResultSetHeader>(
        `INSERT INTO ballots (poll_id, voter_username, is_abstention, voter_age, voter_gender)
         VALUES (?, ?, ?, ?, ?)`,
        [
          input.pollId,
          input.username,
          input.isAbstention ? 1 : 0,
          input.voterAge,
          input.voterGender,
        ],
      );
      ballotId = result.insertId;
    }
    if (!input.isAbstention) {
      for (const optionId of input.optionIds) {
        await conn.execute(
          `INSERT INTO ballot_selections (ballot_id, option_id) VALUES (?, ?)`,
          [ballotId, optionId],
        );
      }
    }
  });
}

export async function listBallotsForUser(username: string) {
  return queryRows<
    RowDataPacket & {
      public_id: string;
      alias: string | null;
      question: string;
      end_at: Date;
      is_abstention: number;
      option_labels: string | null;
    }
  >(
    `SELECT p.public_id, p.alias, p.question, p.end_at, b.is_abstention,
      (SELECT GROUP_CONCAT(o.label ORDER BY o.sort_order SEPARATOR ', ')
         FROM ballot_selections bs
         JOIN poll_options o ON o.id = bs.option_id
        WHERE bs.ballot_id = b.id) AS option_labels
     FROM ballots b
     JOIN polls p ON p.id = b.poll_id
     WHERE b.voter_username = ? AND p.deleted_at IS NULL
     ORDER BY b.updated_at DESC`,
    [username],
  );
}

export async function getOptionCounts(pollId: number) {
  return queryRows<RowDataPacket & { option_id: number; votes: number }>(
    `SELECT o.id AS option_id, COUNT(bs.ballot_id) AS votes
     FROM poll_options o
     LEFT JOIN ballot_selections bs ON bs.option_id = o.id
     WHERE o.poll_id = ?
     GROUP BY o.id`,
    [pollId],
  );
}

export async function getAbstentionCount(pollId: number): Promise<number> {
  const rows = await queryRows<RowDataPacket & { c: number }>(
    `SELECT COUNT(*) AS c FROM ballots WHERE poll_id = ? AND is_abstention = 1`,
    [pollId],
  );
  return Number(rows[0]?.c ?? 0);
}

export async function getDemographicBallots(pollId: number) {
  return queryRows<
    RowDataPacket & {
      voter_age: number | null;
      voter_gender: "male" | "female" | null;
      is_abstention: number;
    }
  >(
    `SELECT voter_age, voter_gender, is_abstention FROM ballots WHERE poll_id = ?`,
    [pollId],
  );
}

/** Named ballots for poll creator transparency (FR-PO-034). */
export async function listNamedBallotsForPoll(pollId: number) {
  return queryRows<
    RowDataPacket & {
      voter_username: string;
      is_abstention: number;
      updated_at: Date;
      option_labels: string | null;
    }
  >(
    `SELECT b.voter_username, b.is_abstention, b.updated_at,
      (SELECT GROUP_CONCAT(o.label ORDER BY o.sort_order SEPARATOR ', ')
         FROM ballot_selections bs
         JOIN poll_options o ON o.id = bs.option_id
        WHERE bs.ballot_id = b.id) AS option_labels
     FROM ballots b
     WHERE b.poll_id = ?
     ORDER BY b.updated_at DESC`,
    [pollId],
  );
}
