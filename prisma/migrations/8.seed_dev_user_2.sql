-- Migration 8: Second dev user for match E2E (opponent)
-- Run: npm run db:migrate:8

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
    'a0000000-0000-4000-8000-000000000002',
    'dev-sportheroes-test-user-2',
    'dev.opponent@sportheroes.local',
    '+919000000002',
    'Dev Opponent',
    'Opponent',
    'Mumbai',
    'India',
    true
)
ON CONFLICT (firebase_uid) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    is_active = true,
    updated_at = now();
