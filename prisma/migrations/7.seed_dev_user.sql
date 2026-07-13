-- Migration 7: Seed development test user (no Firebase required for API testing)
-- Run: npm run db:seed:dev
-- Fixed UUID so JWT generation is reproducible

INSERT INTO users (
    id,
    firebase_uid,
    email,
    phone_number,
    full_name,
    display_name,
    city,
    country,
    is_active
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
    display_name = EXCLUDED.display_name,
    phone_number = EXCLUDED.phone_number,
    email = EXCLUDED.email,
    is_active = true,
    updated_at = now();
