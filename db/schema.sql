CREATE TABLE IF NOT EXISTS polls (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(32) NOT NULL,
  alias VARCHAR(64) NULL,
  creator_username VARCHAR(64) NOT NULL,
  question VARCHAR(500) NOT NULL,
  description TEXT NULL,
  choice_mode ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  live_result_shares TINYINT(1) NOT NULL DEFAULT 0,
  country_code VARCHAR(8) NULL,
  continental_code VARCHAR(8) NULL,
  min_age INT NULL,
  max_age INT NULL,
  gender ENUM('male', 'female') NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  published_at DATETIME NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_polls_public_id (public_id),
  UNIQUE KEY uq_polls_alias (alias),
  KEY idx_polls_creator (creator_username),
  KEY idx_polls_status_end (status, end_at),
  KEY idx_polls_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  poll_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(300) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_poll_options_poll (poll_id),
  CONSTRAINT fk_poll_options_poll FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ballots (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  poll_id BIGINT UNSIGNED NOT NULL,
  voter_username VARCHAR(64) NOT NULL,
  is_abstention TINYINT(1) NOT NULL DEFAULT 0,
  voter_age INT NULL,
  voter_gender ENUM('male', 'female') NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ballots_poll_voter (poll_id, voter_username),
  KEY idx_ballots_poll (poll_id),
  CONSTRAINT fk_ballots_poll FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ballot_selections (
  ballot_id BIGINT UNSIGNED NOT NULL,
  option_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (ballot_id, option_id),
  KEY idx_ballot_selections_option (option_id),
  CONSTRAINT fk_ballot_selections_ballot FOREIGN KEY (ballot_id) REFERENCES ballots (id) ON DELETE CASCADE,
  CONSTRAINT fk_ballot_selections_option FOREIGN KEY (option_id) REFERENCES poll_options (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS poll_scores (
  poll_id BIGINT UNSIGNED NOT NULL,
  user_username VARCHAR(64) NOT NULL,
  value TINYINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (poll_id, user_username),
  CONSTRAINT fk_poll_scores_poll FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE,
  CONSTRAINT chk_poll_scores_value CHECK (value IN (-1, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  poll_id BIGINT UNSIGNED NOT NULL,
  author_username VARCHAR(64) NOT NULL,
  root_id BIGINT UNSIGNED NULL,
  body TEXT NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_comments_poll (poll_id),
  KEY idx_comments_root (root_id),
  CONSTRAINT fk_comments_poll FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_root FOREIGN KEY (root_id) REFERENCES comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comment_scores (
  comment_id BIGINT UNSIGNED NOT NULL,
  user_username VARCHAR(64) NOT NULL,
  value TINYINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_username),
  CONSTRAINT fk_comment_scores_comment FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
  CONSTRAINT chk_comment_scores_value CHECK (value IN (-1, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
