-- ============================================================
-- Seva Parivartan – Migration 001
-- Adds: districts table, profile improvements,
--       connection improvements, improved RLS policies.
-- Additive: no tables or columns are dropped.
-- Run once in your Supabase SQL Editor.
-- ============================================================

-- ── EXTENSION ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ────────────────────────────────────────────────────────────
-- SECTION 1 – DISTRICTS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS districts (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT '',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (name, state)
);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read districts"
  ON districts FOR SELECT
  USING (auth.role() = 'authenticated');


-- ────────────────────────────────────────────────────────────
-- SECTION 2 – SEED DISTRICTS (Uttar Pradesh)
-- ────────────────────────────────────────────────────────────

INSERT INTO districts (name, state) VALUES
  ('Agra',            'Uttar Pradesh'),
  ('Aligarh',         'Uttar Pradesh'),
  ('Allahabad',       'Uttar Pradesh'),
  ('Ambedkar Nagar',  'Uttar Pradesh'),
  ('Amethi',          'Uttar Pradesh'),
  ('Amroha',          'Uttar Pradesh'),
  ('Auraiya',         'Uttar Pradesh'),
  ('Ayodhya',         'Uttar Pradesh'),
  ('Azamgarh',        'Uttar Pradesh'),
  ('Badaun',          'Uttar Pradesh'),
  ('Baghpat',         'Uttar Pradesh'),
  ('Bahraich',        'Uttar Pradesh'),
  ('Ballia',          'Uttar Pradesh'),
  ('Balrampur',       'Uttar Pradesh'),
  ('Banda',           'Uttar Pradesh'),
  ('Barabanki',       'Uttar Pradesh'),
  ('Bareilly',        'Uttar Pradesh'),
  ('Basti',           'Uttar Pradesh'),
  ('Bhadohi',         'Uttar Pradesh'),
  ('Bijnor',          'Uttar Pradesh'),
  ('Bulandshahr',     'Uttar Pradesh'),
  ('Chandauli',       'Uttar Pradesh'),
  ('Chitrakoot',      'Uttar Pradesh'),
  ('Deoria',          'Uttar Pradesh'),
  ('Etah',            'Uttar Pradesh'),
  ('Etawah',          'Uttar Pradesh'),
  ('Farrukhabad',     'Uttar Pradesh'),
  ('Fatehpur',        'Uttar Pradesh'),
  ('Firozabad',       'Uttar Pradesh'),
  ('Gautam Buddha Nagar', 'Uttar Pradesh'),
  ('Ghaziabad',       'Uttar Pradesh'),
  ('Ghazipur',        'Uttar Pradesh'),
  ('Gonda',           'Uttar Pradesh'),
  ('Gorakhpur',       'Uttar Pradesh'),
  ('Hamirpur',        'Uttar Pradesh'),
  ('Hapur',           'Uttar Pradesh'),
  ('Hardoi',          'Uttar Pradesh'),
  ('Hathras',         'Uttar Pradesh'),
  ('Jalaun',          'Uttar Pradesh'),
  ('Jaunpur',         'Uttar Pradesh'),
  ('Jhansi',          'Uttar Pradesh'),
  ('Kannauj',         'Uttar Pradesh'),
  ('Kanpur Dehat',    'Uttar Pradesh'),
  ('Kanpur Nagar',    'Uttar Pradesh'),
  ('Kasganj',         'Uttar Pradesh'),
  ('Kaushambi',       'Uttar Pradesh'),
  ('Kheri',           'Uttar Pradesh'),
  ('Kushinagar',      'Uttar Pradesh'),
  ('Lalitpur',        'Uttar Pradesh'),
  ('Lucknow',         'Uttar Pradesh'),
  ('Maharajganj',     'Uttar Pradesh'),
  ('Mahoba',          'Uttar Pradesh'),
  ('Mainpuri',        'Uttar Pradesh'),
  ('Mathura',         'Uttar Pradesh'),
  ('Mau',             'Uttar Pradesh'),
  ('Meerut',          'Uttar Pradesh'),
  ('Mirzapur',        'Uttar Pradesh'),
  ('Moradabad',       'Uttar Pradesh'),
  ('Muzaffarnagar',   'Uttar Pradesh'),
  ('Pilibhit',        'Uttar Pradesh'),
  ('Pratapgarh',      'Uttar Pradesh'),
  ('Prayagraj',       'Uttar Pradesh'),
  ('Raebareli',       'Uttar Pradesh'),
  ('Rampur',          'Uttar Pradesh'),
  ('Saharanpur',      'Uttar Pradesh'),
  ('Sambhal',         'Uttar Pradesh'),
  ('Sant Kabir Nagar','Uttar Pradesh'),
  ('Shahjahanpur',    'Uttar Pradesh'),
  ('Shamli',          'Uttar Pradesh'),
  ('Shravasti',       'Uttar Pradesh'),
  ('Siddharthnagar',  'Uttar Pradesh'),
  ('Sitapur',         'Uttar Pradesh'),
  ('Sonbhadra',       'Uttar Pradesh'),
  ('Sultanpur',       'Uttar Pradesh'),
  ('Unnao',           'Uttar Pradesh'),
  ('Varanasi',        'Uttar Pradesh')
ON CONFLICT (name, state) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- SECTION 3 – IMPROVE PROFILES TABLE (additive)
-- ────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified'));

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_district_id INT REFERENCES districts(id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS desired_district_id INT REFERENCES districts(id);

-- Backfill district FKs from existing free-text values
UPDATE profiles p
SET current_district_id = d.id
FROM districts d
WHERE LOWER(TRIM(p.current_dist)) = LOWER(d.name)
  AND p.current_district_id IS NULL
  AND p.current_dist IS NOT NULL
  AND p.current_dist <> '';

UPDATE profiles p
SET desired_district_id = d.id
FROM districts d
WHERE LOWER(TRIM(p.desired_dist)) = LOWER(d.name)
  AND p.desired_district_id IS NULL
  AND p.desired_dist IS NOT NULL
  AND p.desired_dist <> '';

-- Backfill profile_completed for existing users with all required fields
UPDATE profiles
SET profile_completed = true
WHERE profile_completed = false
  AND full_name   IS NOT NULL AND full_name   <> ''
  AND designation IS NOT NULL
  AND current_dist IS NOT NULL AND current_dist <> ''
  AND desired_dist IS NOT NULL AND desired_dist <> ''
  AND current_dist <> desired_dist;

-- Matching index
CREATE INDEX IF NOT EXISTS idx_profiles_matching
  ON profiles (current_district_id, desired_district_id, designation, is_active, profile_completed);


-- ────────────────────────────────────────────────────────────
-- SECTION 4 – IMPROVE CONNECTIONS TABLE
-- ────────────────────────────────────────────────────────────

ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Replace status check constraint to include 'withdrawn'
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_status_check;
ALTER TABLE connections
  ADD CONSTRAINT connections_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn'));

-- Prevent self-connections at DB level
ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_no_self;
ALTER TABLE connections
  ADD CONSTRAINT connections_no_self CHECK (requester_id <> target_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_connections_target_status
  ON connections (target_id, status);

CREATE INDEX IF NOT EXISTS idx_connections_requester
  ON connections (requester_id);

-- Trigger: auto-set responded_at when status changes from pending
CREATE OR REPLACE FUNCTION set_responded_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status <> 'pending' AND OLD.status = 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_responded_at ON connections;
CREATE TRIGGER trg_set_responded_at
  BEFORE UPDATE OF status ON connections
  FOR EACH ROW EXECUTE FUNCTION set_responded_at();


-- ────────────────────────────────────────────────────────────
-- SECTION 5 – IMPROVED ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

-- ── 5a. PROFILES ────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone logged in can read all active profiles" ON profiles;
DROP POLICY IF EXISTS "User can insert their own profile"             ON profiles;
DROP POLICY IF EXISTS "User can update their own profile"             ON profiles;
DROP POLICY IF EXISTS "Read active completed profiles"               ON profiles;
DROP POLICY IF EXISTS "Read own profile"                             ON profiles;
DROP POLICY IF EXISTS "Insert own profile"                           ON profiles;
DROP POLICY IF EXISTS "Update own profile fields"                    ON profiles;

-- Other authenticated users can see active + completed profiles
CREATE POLICY "Read active completed profiles"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_active = true
    AND profile_completed = true
  );

-- Users can always read their own profile
CREATE POLICY "Read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can create only their own profile row
CREATE POLICY "Insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
-- (verification_status/verified_at are blocked in the API layer)
CREATE POLICY "Update own profile fields"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── 5b. CONNECTIONS ─────────────────────────────────────────

DROP POLICY IF EXISTS "Users see their own connections"  ON connections;
DROP POLICY IF EXISTS "User can send a connection"       ON connections;
DROP POLICY IF EXISTS "Target can accept or reject"      ON connections;
DROP POLICY IF EXISTS "Participants can read their connections" ON connections;
DROP POLICY IF EXISTS "Requester can send a connection"  ON connections;
DROP POLICY IF EXISTS "Target can accept or reject pending" ON connections;
DROP POLICY IF EXISTS "Requester can withdraw pending"   ON connections;

-- Only participants can see their connections
CREATE POLICY "Participants can read their connections"
  ON connections FOR SELECT
  USING (
    auth.uid() = requester_id
    OR auth.uid() = target_id
  );

-- Requester must be the logged-in user; target must differ
CREATE POLICY "Requester can send a connection"
  ON connections FOR INSERT
  WITH CHECK (
    auth.uid() = requester_id
    AND requester_id <> target_id
  );

-- Only the target can accept or reject a pending request
CREATE POLICY "Target can accept or reject pending"
  ON connections FOR UPDATE
  USING (auth.uid() = target_id AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected'));

-- Requester can withdraw their own pending request
CREATE POLICY "Requester can withdraw pending"
  ON connections FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (status = 'withdrawn');


-- ────────────────────────────────────────────────────────────
-- SECTION 6 – MATCHING VIEW
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW match_candidates AS
SELECT
  p.id,
  p.full_name,
  p.designation,
  p.mobile,
  p.current_district_id,
  cd.name  AS current_district_name,
  cd.state AS current_district_state,
  p.desired_district_id,
  dd.name  AS desired_district_name,
  dd.state AS desired_district_state,
  p.verification_status,
  p.profile_completed,
  p.is_active
FROM profiles p
JOIN districts cd ON cd.id = p.current_district_id
JOIN districts dd ON dd.id = p.desired_district_id
WHERE
  p.is_active             = true
  AND p.profile_completed = true
  AND p.current_district_id IS NOT NULL
  AND p.desired_district_id IS NOT NULL
  AND p.current_district_id <> p.desired_district_id;

GRANT SELECT ON match_candidates TO authenticated;

-- ────────────────────────────────────────────────────────────
-- DONE
-- ────────────────────────────────────────────────────────────
