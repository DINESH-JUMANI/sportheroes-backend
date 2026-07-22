-- Migration 7: Seed development test user
-- Works with auth_uid (after mig 17) or supabase_uid / firebase_uid (legacy)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'auth_uid'
  ) THEN
    INSERT INTO users (
      id, auth_uid, email, phone_number, full_name, display_name, city, country, is_active
    ) VALUES (
      'a0000000-0000-4000-8000-000000000001',
      'dev-sportheroes-test-user',
      'dev.tester@sportheroes.local',
      '+919000000001',
      'Dev Tester',
      'Dev',
      'Mumbai',
      'India',
      true
    )
    ON CONFLICT (auth_uid) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      display_name = EXCLUDED.display_name,
      phone_number = EXCLUDED.phone_number,
      email = EXCLUDED.email,
      is_active = true,
      updated_at = now();
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'supabase_uid'
  ) THEN
    INSERT INTO users (
      id, supabase_uid, email, phone_number, full_name, display_name, city, country, is_active
    ) VALUES (
      'a0000000-0000-4000-8000-000000000001',
      'dev-sportheroes-test-user',
      'dev.tester@sportheroes.local',
      '+919000000001',
      'Dev Tester',
      'Dev',
      'Mumbai',
      'India',
      true
    )
    ON CONFLICT (supabase_uid) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      is_active = true,
      updated_at = now();
  ELSE
    INSERT INTO users (
      id, firebase_uid, email, phone_number, full_name, display_name, city, country, is_active
    ) VALUES (
      'a0000000-0000-4000-8000-000000000001',
      'dev-sportheroes-test-user',
      'dev.tester@sportheroes.local',
      '+919000000001',
      'Dev Tester',
      'Dev',
      'Mumbai',
      'India',
      true
    )
    ON CONFLICT (firebase_uid) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      is_active = true,
      updated_at = now();
  END IF;
END $$;
