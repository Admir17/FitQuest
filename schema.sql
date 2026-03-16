-- ============================================================
-- FitQuest — Database Schema
-- PostgreSQL 15+
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE exercise_category AS ENUM (
  'strength',
  'cardio',
  'core',
  'flexibility',
  'sport',
  'custom'
);

CREATE TYPE difficulty_level AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

CREATE TYPE xp_source_type AS ENUM (
  'workout_set',
  'achievement',
  'streak_bonus'
);

CREATE TYPE achievement_condition_type AS ENUM (
  'workouts_total',
  'streak_days',
  'xp_total',
  'unique_exercises',
  'custom_exercise_created'
);

-- ============================================================
-- CORE: USERS
-- ============================================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  avatar_url      VARCHAR(500),
  xp_total        INTEGER      NOT NULL DEFAULT 0,
  level           INTEGER      NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- EXERCISES
-- ============================================================

CREATE TABLE exercises (
  id             UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(100)      NOT NULL,
  category       exercise_category NOT NULL DEFAULT 'custom',
  muscle_groups  TEXT[]            NOT NULL DEFAULT '{}',
  is_system      BOOLEAN           NOT NULL DEFAULT FALSE,
  created_by     UUID              REFERENCES users(id) ON DELETE SET NULL,
  xp_per_set     INTEGER           NOT NULL DEFAULT 10,
  created_at     TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- Prevent duplicate exercise names per user (NULL created_by = system exercise)
CREATE UNIQUE INDEX idx_exercises_name_user
  ON exercises(name, COALESCE(created_by, '00000000-0000-0000-0000-000000000000'::UUID));

CREATE INDEX idx_exercises_is_system  ON exercises(is_system);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);

-- ============================================================
-- WORKOUT TEMPLATES (admin-curated only)
-- ============================================================

CREATE TABLE workout_templates (
  id             UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(100)     NOT NULL,
  description    TEXT,
  difficulty     difficulty_level NOT NULL DEFAULT 'beginner',
  estimated_min  INTEGER,
  tags           TEXT[]           NOT NULL DEFAULT '{}',
  is_active      BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Junction table: which exercises belong to which template
CREATE TABLE template_exercises (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id       UUID         NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id       UUID         NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index       INTEGER      NOT NULL DEFAULT 0,
  target_sets       INTEGER,
  target_reps       INTEGER,
  target_weight_kg  NUMERIC(6,2),
  UNIQUE (template_id, order_index)
);

CREATE INDEX idx_template_exercises_template ON template_exercises(template_id);

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================

CREATE TABLE workout_sessions (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id  UUID         REFERENCES workout_templates(id) ON DELETE SET NULL,
  name         VARCHAR(100) NOT NULL,
  started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,                -- NULL means session is still in progress
  xp_earned    INTEGER      NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workout_sessions_user_id    ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_started_at ON workout_sessions(started_at DESC);

-- ============================================================
-- WORKOUT SETS
-- ============================================================

CREATE TABLE workout_sets (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID         NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id  UUID         NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  set_number   INTEGER      NOT NULL,
  reps         INTEGER,
  weight_kg    NUMERIC(6,2),
  duration_sec INTEGER,                    -- for time-based exercises (e.g. plank, wall sit)
  xp_awarded   INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, exercise_id, set_number)
);

CREATE INDEX idx_workout_sets_session  ON workout_sets(session_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);

-- ============================================================
-- GAMIFICATION: ACHIEVEMENTS
-- ============================================================

CREATE TABLE achievements (
  id               UUID                       PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(100)               NOT NULL UNIQUE,
  description      TEXT                       NOT NULL,
  icon             VARCHAR(10)                NOT NULL DEFAULT '🏆',
  condition_type   achievement_condition_type NOT NULL,
  condition_value  INTEGER                    NOT NULL,
  xp_reward        INTEGER                    NOT NULL DEFAULT 100,
  created_at       TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

-- Tracks which user has unlocked which achievement
CREATE TABLE user_achievements (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  UUID        NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)     -- each badge can only be unlocked once per user
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ============================================================
-- GAMIFICATION: STREAK
-- ============================================================

CREATE TABLE streaks (
  id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  current_streak      INTEGER NOT NULL DEFAULT 0,
  longest_streak      INTEGER NOT NULL DEFAULT 0,
  last_activity_date  DATE,              -- used by the nightly cron job to detect missed days
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GAMIFICATION: XP LOG
-- ============================================================

CREATE TABLE xp_logs (
  id           UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id    UUID,                      -- polymorphic FK: workout_set, achievement, etc.
  source_type  xp_source_type NOT NULL,
  xp_amount    INTEGER        NOT NULL,
  reason       VARCHAR(255)   NOT NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_logs_user_id    ON xp_logs(user_id);
CREATE INDEX idx_xp_logs_created_at ON xp_logs(created_at DESC);

-- ============================================================
-- AUTH: REFRESH TOKENS
-- ============================================================

CREATE TABLE refresh_tokens (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,   -- store hash, never the raw token
  expires_at  TIMESTAMPTZ  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user    ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================================
-- TRIGGER: keep users.updated_at current
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
