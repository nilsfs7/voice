-- Backfill implicit creator/author self-upvote (+1) for existing rows (FR-PO-031, FR-CO-008).
INSERT INTO poll_scores (poll_id, user_username, value)
SELECT p.id, p.creator_username, 1
FROM polls p
WHERE NOT EXISTS (
  SELECT 1 FROM poll_scores s
  WHERE s.poll_id = p.id AND s.user_username = p.creator_username
);

INSERT INTO comment_scores (comment_id, user_username, value)
SELECT c.id, c.author_username, 1
FROM comments c
WHERE NOT EXISTS (
  SELECT 1 FROM comment_scores s
  WHERE s.comment_id = c.id AND s.user_username = c.author_username
);
