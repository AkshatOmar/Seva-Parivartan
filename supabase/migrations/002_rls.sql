-- ============================================================
-- 002_rls.sql  –  Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE departments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_locations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users          ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: check if user is super_admin
-- ============================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: check if user is any admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: get employee_profile id for current user
CREATE OR REPLACE FUNCTION my_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employee_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- DEPARTMENTS – public read, admin write
-- ============================================================
CREATE POLICY "public_read_departments" ON departments
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_departments" ON departments
  FOR ALL USING (is_admin());

-- ============================================================
-- DESIGNATIONS – public read, admin write
-- ============================================================
CREATE POLICY "public_read_designations" ON designations
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_designations" ON designations
  FOR ALL USING (is_admin());

-- ============================================================
-- POSTING LOCATIONS – public read, admin write
-- ============================================================
CREATE POLICY "public_read_locations" ON posting_locations
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_locations" ON posting_locations
  FOR ALL USING (is_admin());

-- ============================================================
-- EMPLOYEE PROFILES
-- ============================================================
-- Anyone (authenticated) can view publicly listed profiles
CREATE POLICY "read_public_profiles" ON employee_profiles
  FOR SELECT USING (is_publicly_listed = true OR user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "update_own_profile" ON employee_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own profile (once)
CREATE POLICY "insert_own_profile" ON employee_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "admin_read_all_profiles" ON employee_profiles
  FOR SELECT USING (is_admin());

-- Admins can update profiles (activate/deactivate)
CREATE POLICY "admin_update_profiles" ON employee_profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- TRANSFER PREFERENCES
-- ============================================================
CREATE POLICY "read_own_preferences" ON transfer_preferences
  FOR SELECT USING (employee_id = my_employee_id());

CREATE POLICY "manage_own_preferences" ON transfer_preferences
  FOR ALL USING (employee_id = my_employee_id());

CREATE POLICY "admin_read_preferences" ON transfer_preferences
  FOR SELECT USING (is_admin());

-- ============================================================
-- MATCHES
-- ============================================================
CREATE POLICY "read_own_matches" ON matches
  FOR SELECT USING (
    employee_a_id = my_employee_id() OR
    employee_b_id = my_employee_id()
  );

CREATE POLICY "admin_read_all_matches" ON matches
  FOR SELECT USING (is_admin());

CREATE POLICY "admin_manage_matches" ON matches
  FOR ALL USING (is_super_admin());

-- ============================================================
-- CONNECTION REQUESTS
-- ============================================================
CREATE POLICY "read_own_connection_requests" ON connection_requests
  FOR SELECT USING (
    sender_id = my_employee_id() OR
    receiver_id = my_employee_id()
  );

CREATE POLICY "send_connection_request" ON connection_requests
  FOR INSERT WITH CHECK (sender_id = my_employee_id());

CREATE POLICY "update_own_received_request" ON connection_requests
  FOR UPDATE USING (
    receiver_id = my_employee_id() OR
    sender_id = my_employee_id()
  );

CREATE POLICY "admin_read_connections" ON connection_requests
  FOR SELECT USING (is_admin());

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE POLICY "read_own_conversations" ON conversations
  FOR SELECT USING (
    participant_a = my_employee_id() OR
    participant_b = my_employee_id()
  );

CREATE POLICY "admin_read_conversations" ON conversations
  FOR SELECT USING (is_admin());

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE POLICY "read_messages_in_own_conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = my_employee_id() OR c.participant_b = my_employee_id())
    )
  );

CREATE POLICY "send_messages_in_own_conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = my_employee_id() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = my_employee_id() OR c.participant_b = my_employee_id())
    )
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "read_own_notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "update_own_notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System/admin can insert notifications
CREATE POLICY "insert_notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE POLICY "super_admin_manage_admins" ON admin_users
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_read_own" ON admin_users
  FOR SELECT USING (user_id = auth.uid());
