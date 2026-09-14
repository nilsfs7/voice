import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { getDatabaseUrl } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var __voiceMysqlPool: Pool | undefined;
}

type SqlParam = string | number | boolean | Date | null | Buffer;

export function getPool(): Pool {
  if (!global.__voiceMysqlPool) {
    global.__voiceMysqlPool = mysql.createPool(getDatabaseUrl());
  }
  return global.__voiceMysqlPool;
}

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  const [rows] = await getPool().execute<T[]>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params: SqlParam[] = [],
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const value = await fn(conn);
    await conn.commit();
    return value;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
