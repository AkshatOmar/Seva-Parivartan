-- ============================================================
-- 003_functions.sql  –  Matching Engine & Triggers
-- ============================================================

-- ============================================================
-- CORE MATCHING FUNCTION
-- Finds all valid 2-way swaps and inserts into matches table
-- ============================================================
CREATE OR REPLACE FUNCTION run_matching()
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER;
BEGIN
  INSERT INTO matches (employee_a_id, employee_b_id, match_score)
  SELECT
    LEAST(a.id, b.id)    AS employee_a_id,
    GREATEST(a.id, b.id) AS employee_b_id,
    -- Score: base 100 + 50 bonus if both have each other as priority-1
    100 + (
      CASE WHEN tp_a.priority = 1 AND tp_b.priority = 1 THEN 50
           WHEN tp_a.priority = 1 OR  tp_b.priority = 1 THEN 25
           ELSE 0
      END
    ) AS match_score
  FROM employee_profiles a
  JOIN transfer_preferences tp_a ON tp_a.employee_id = a.id
  JOIN employee_profiles b       ON b.id <> a.id
  JOIN transfer_preferences tp_b ON tp_b.employee_id = b.id
  WHERE
    a.is_active = true AND a.is_publicly_listed = true AND a.is_profile_complete = true
    AND b.is_active = true AND b.is_publicly_listed = true AND b.is_profile_complete = true
    AND a.designation_id         = b.designation_id              -- same designation
    AND a.department_id          = b.department_id               -- same department
    AND a.current_location_id    = tp_b.desired_location_id      -- A's location = B's wish
    AND b.current_location_id    = tp_a.desired_location_id      -- B's location = A's wish
    AND LEAST(a.id, b.id) < GREATEST(a.id, b.id)                 -- prevent self-reference
  ON CONFLICT (employee_a_id, employee_b_id)
  DO UPDATE SET
    match_score = EXCLUDED.match_score,
    updated_at  = now()
  WHERE matches.status = 'active';

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER: re-run matching when employee profile or preferences change
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_matching_on_profile_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Expire matches for this employee where they no longer meet criteria
  UPDATE matches
  SET status = 'expired', updated_at = now()
  WHERE (employee_a_id = NEW.id OR employee_b_id = NEW.id)
    AND status = 'active';

  -- Re-run matching (will re-insert valid matches)
  PERFORM run_matching();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_on_profile_update
  AFTER UPDATE OF designation_id, department_id, current_location_id, is_active, is_publicly_listed, is_profile_complete
  ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_matching_on_profile_change();

-- Trigger on insert (new employee)
CREATE OR REPLACE FUNCTION trigger_matching_on_profile_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM run_matching();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_on_profile_insert
  AFTER INSERT ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_matching_on_profile_insert();

-- Trigger on transfer preferences change
CREATE OR REPLACE FUNCTION trigger_matching_on_preference_change()
RETURNS TRIGGER AS $$
DECLARE
  emp_id UUID;
BEGIN
  emp_id := COALESCE(NEW.employee_id, OLD.employee_id);

  -- Expire existing matches for this employee
  UPDATE matches
  SET status = 'expired', updated_at = now()
  WHERE (employee_a_id = emp_id OR employee_b_id = emp_id)
    AND status = 'active';

  -- Re-run matching
  PERFORM run_matching();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_match_on_preference_change
  AFTER INSERT OR UPDATE OR DELETE ON transfer_preferences
  FOR EACH ROW
  EXECUTE FUNCTION trigger_matching_on_preference_change();

-- ============================================================
-- TRIGGER: auto-create conversation when connection is accepted
-- ============================================================
CREATE OR REPLACE FUNCTION handle_connection_accepted()
RETURNS TRIGGER AS $$
DECLARE
  match_rec RECORD;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Update match status
    UPDATE matches SET status = 'connected', updated_at = now()
    WHERE id = NEW.match_id;

    -- Get match details
    SELECT * INTO match_rec FROM matches WHERE id = NEW.match_id;

    -- Create conversation if not exists
    INSERT INTO conversations (match_id, participant_a, participant_b)
    VALUES (NEW.match_id, match_rec.employee_a_id, match_rec.employee_b_id)
    ON CONFLICT (match_id) DO NOTHING;

    -- Notify sender (their request was accepted)
    INSERT INTO notifications (user_id, type, title, body, metadata)
    SELECT
      ep.user_id,
      'request_accepted',
      'Connection Request Accepted! 🎉',
      'Your connection request has been accepted. You can now chat.',
      jsonb_build_object('match_id', NEW.match_id, 'connection_id', NEW.id)
    FROM employee_profiles ep
    WHERE ep.id = NEW.sender_id;
  END IF;

  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    -- Notify sender
    INSERT INTO notifications (user_id, type, title, body, metadata)
    SELECT
      ep.user_id,
      'request_rejected',
      'Connection Request Update',
      'Your connection request was not accepted this time.',
      jsonb_build_object('match_id', NEW.match_id)
    FROM employee_profiles ep
    WHERE ep.id = NEW.sender_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_connection_accepted
  AFTER UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_connection_accepted();

-- ============================================================
-- TRIGGER: notify on new connection request
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify receiver
  INSERT INTO notifications (user_id, type, title, body, metadata)
  SELECT
    ep.user_id,
    'connection_request',
    'New Connection Request',
    'Someone wants to connect with you for a mutual transfer.',
    jsonb_build_object(
      'match_id', NEW.match_id,
      'connection_id', NEW.id,
      'sender_id', NEW.sender_id
    )
  FROM employee_profiles ep
  WHERE ep.id = NEW.receiver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_connection_request
  AFTER INSERT ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_connection_request();

-- ============================================================
-- TRIGGER: notify on new message
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conv RECORD;
  recipient_id UUID;
BEGIN
  SELECT * INTO conv FROM conversations WHERE id = NEW.conversation_id;

  -- Determine recipient
  IF conv.participant_a = NEW.sender_id THEN
    recipient_id := conv.participant_b;
  ELSE
    recipient_id := conv.participant_a;
  END IF;

  -- Insert notification for recipient
  INSERT INTO notifications (user_id, type, title, body, metadata)
  SELECT
    ep.user_id,
    'new_message',
    'New Message',
    'You have a new message from a matched employee.',
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id
    )
  FROM employee_profiles ep
  WHERE ep.id = recipient_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_message();

-- ============================================================
-- FUNCTION: mark profile as complete
-- ============================================================
CREATE OR REPLACE FUNCTION check_profile_complete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_profile_complete := (
    NEW.full_name IS NOT NULL AND
    NEW.department_id IS NOT NULL AND
    NEW.designation_id IS NOT NULL AND
    NEW.current_location_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM transfer_preferences tp WHERE tp.employee_id = NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_profile_complete
  BEFORE INSERT OR UPDATE ON employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_profile_complete();
