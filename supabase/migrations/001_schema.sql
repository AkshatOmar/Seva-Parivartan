-- ============================================================
-- 001_schema.sql  –  Seva Parivartan Core Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  code        TEXT NOT NULL UNIQUE,   -- 'EDU', 'POST', 'POLICE', 'IT', 'HEALTH'
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. DESIGNATIONS
-- ============================================================
CREATE TABLE designations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  pay_level     INTEGER,               -- 7th Pay Commission level 1-18
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(department_id, name)
);

-- ============================================================
-- 3. POSTING LOCATIONS  (all Indian districts)
-- ============================================================
CREATE TABLE posting_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,           -- "Jaipur", "Lucknow"
  state_name  TEXT NOT NULL,           -- "Rajasthan"
  state_code  TEXT NOT NULL,           -- "RJ"
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, state_code)
);

-- ============================================================
-- 4. EMPLOYEE PROFILES
-- ============================================================
CREATE TABLE employee_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Personal
  full_name            TEXT NOT NULL,
  gender               TEXT CHECK (gender IN ('male', 'female', 'other')),
  mobile               TEXT,
  employee_number      TEXT,           -- Optional self-declared

  -- Service
  department_id        UUID REFERENCES departments(id),
  designation_id       UUID REFERENCES designations(id),
  date_of_joining      DATE,

  -- Current Posting
  current_location_id  UUID REFERENCES posting_locations(id),
  current_office       TEXT,           -- e.g. "KV No.1, Jaipur"

  -- Profile
  profile_photo_url    TEXT,
  bio                  TEXT,
  is_active            BOOLEAN DEFAULT true,
  is_publicly_listed   BOOLEAN DEFAULT true,
  is_profile_complete  BOOLEAN DEFAULT false,

  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. TRANSFER PREFERENCES  (up to 3 desired districts)
-- ============================================================
CREATE TABLE transfer_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id         UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  desired_location_id UUID NOT NULL REFERENCES posting_locations(id),
  priority            INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  reason              TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, desired_location_id)
);

-- ============================================================
-- 6. MATCHES  (auto-computed)
-- ============================================================
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_a_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  employee_b_id UUID NOT NULL REFERENCES employee_profiles(id) ON DELETE CASCADE,
  match_score   INTEGER DEFAULT 100,
  status        TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'connected', 'expired', 'completed')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_a_id, employee_b_id),
  CHECK (employee_a_id < employee_b_id)   -- canonical ordering prevents duplicates
);

-- ============================================================
-- 7. CONNECTION REQUESTS
-- ============================================================
CREATE TABLE connection_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES employee_profiles(id),
  receiver_id  UUID NOT NULL REFERENCES employee_profiles(id),
  message      TEXT,
  status       TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  responded_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_id, sender_id)
);

-- ============================================================
-- 8. CONVERSATIONS + MESSAGES
-- ============================================================
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  participant_a UUID NOT NULL REFERENCES employee_profiles(id),
  participant_b UUID NOT NULL REFERENCES employee_profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES employee_profiles(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'new_match', 'connection_request', 'request_accepted',
               'request_rejected', 'new_message', 'match_expired')),
  title      TEXT NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT false,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 10. ADMIN USERS
-- ============================================================
CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role          TEXT NOT NULL DEFAULT 'dept_admin'
                  CHECK (role IN ('super_admin', 'dept_admin')),
  department_id UUID REFERENCES departments(id),  -- null for super_admin
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_employee_profiles_user_id       ON employee_profiles(user_id);
CREATE INDEX idx_employee_profiles_designation   ON employee_profiles(designation_id);
CREATE INDEX idx_employee_profiles_current_loc   ON employee_profiles(current_location_id);
CREATE INDEX idx_transfer_prefs_employee         ON transfer_preferences(employee_id);
CREATE INDEX idx_transfer_prefs_location         ON transfer_preferences(desired_location_id);
CREATE INDEX idx_matches_employee_a              ON matches(employee_a_id);
CREATE INDEX idx_matches_employee_b              ON matches(employee_b_id);
CREATE INDEX idx_matches_status                  ON matches(status);
CREATE INDEX idx_connection_requests_match       ON connection_requests(match_id);
CREATE INDEX idx_messages_conversation           ON messages(conversation_id);
CREATE INDEX idx_notifications_user              ON notifications(user_id, is_read);

-- ============================================================
-- Updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employee_profiles_updated_at
  BEFORE UPDATE ON employee_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
