import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

function statementsFromFile(filePath) {
  const sql = fs
    .readFileSync(filePath, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
  return sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Apply schema + migrations (TECH-14). Idempotent. */
export async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const connection = await mysql.createConnection(databaseUrl);
  try {
    const schemaPath = path.join(process.cwd(), "db", "schema.sql");
    const schemaStatements = statementsFromFile(schemaPath);
    for (const statement of schemaStatements) {
      await connection.query(statement);
    }
    console.log(
      `[voice] Applied ${schemaStatements.length} statements from db/schema.sql`,
    );

    const migrationsDir = path.join(process.cwd(), "db", "migrations");
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      for (const statement of statementsFromFile(filePath)) {
        try {
          await connection.query(statement);
          console.log(
            `[voice] OK ${file}: ${statement.slice(0, 72).replace(/\s+/g, " ")}`,
          );
        } catch (error) {
          const code = error?.code;
          if (code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME") {
            console.log(`[voice] Skip ${file} (${code})`);
            continue;
          }
          throw error;
        }
      }
    }
  } finally {
    await connection.end();
  }
}

const isCli =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isCli) {
  runMigrations().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
