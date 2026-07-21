-- Migration 10: Add admin role to team_role_type enum
-- Run: npm run db:migrate:10
-- Note: ALTER TYPE must run alone (PostgreSQL limitation).

ALTER TYPE team_role_type ADD VALUE IF NOT EXISTS 'admin';
