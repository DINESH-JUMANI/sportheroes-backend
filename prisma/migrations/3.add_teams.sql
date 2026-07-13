-- Migration 3: Teams and team members
-- Run: npm run db:migrate -- 3.add_teams.sql

CREATE TYPE team_role_type AS ENUM ('captain', 'vice_captain', 'member');

CREATE TABLE IF NOT EXISTS teams (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id          UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    name              VARCHAR(100) NOT NULL,
    short_name        VARCHAR(10),
    logo_url          TEXT,
    description       TEXT,
    captain_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    vice_captain_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_active         BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        team_role_type DEFAULT 'member',
    joined_at   TIMESTAMPTZ DEFAULT now(),
    left_at     TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT true,
    UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
