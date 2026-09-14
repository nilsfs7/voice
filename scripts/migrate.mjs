import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

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

const connection = await mysql.createConnection(databaseUrl);
try {
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schemaStatements = statementsFromFile(schemaPath);
  for (const statement of schemaStatements) {
    await connection.query(statement);
  }
  console.log(`Applied ${schemaStatements.length} statements from db/schema.sql`);

  const migrationsDir = path.join(process.cwd(), "db", "migrations");
  if (fs.existsSync(migrationsDir)) {
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      for (const statement of statementsFromFile(filePath)) {
        try {
          await connection.query(statement);
          console.log(`OK ${file}: ${statement.slice(0, 72).replace(/\s+/g, " ")}`);
        } catch (error) {
          const code = error?.code;
          if (code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME") {
            console.log(`Skip ${file} (${code})`);
            continue;
          }
          throw error;
        }
      }
    }
  }
} finally {
  await connection.end();
}
