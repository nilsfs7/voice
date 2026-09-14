-- Idempotent upgrade for existing Voice DBs (run after schema.sql).
-- Safe to re-run: duplicate column/key errors are ignored by migrate.mjs.

ALTER TABLE polls
  ADD COLUMN alias VARCHAR(64) NULL AFTER public_id;

ALTER TABLE polls
  ADD UNIQUE KEY uq_polls_alias (alias);
