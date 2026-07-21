-- Migration 15: Help & Support (concerns + tickets + images)
-- Run: npm run db:migrate:15

DO $$ BEGIN
  CREATE TYPE support_ticket_status_type AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START 1;

CREATE TABLE IF NOT EXISTS support_concerns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(50) NOT NULL UNIQUE,
    label       VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    sort_order  INT NOT NULL DEFAULT 0,
    is_other    BOOLEAN NOT NULL DEFAULT false,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_concerns_active_sort
  ON support_concerns(is_active, sort_order);

CREATE TABLE IF NOT EXISTS support_tickets (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number      VARCHAR(30) NOT NULL UNIQUE,
    concern_id         UUID NOT NULL REFERENCES support_concerns(id) ON DELETE RESTRICT,
    other_concern_text VARCHAR(200),
    description        TEXT NOT NULL,
    status             support_ticket_status_type NOT NULL DEFAULT 'open',
    created_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_concern ON support_tickets(concern_id);

CREATE TABLE IF NOT EXISTS support_ticket_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    image_blob BYTEA NOT NULL,
    mime_type  VARCHAR(50) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_images_ticket ON support_ticket_images(ticket_id);

CREATE TABLE IF NOT EXISTS support_ticket_status_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    previous_status support_ticket_status_type,
    new_status      support_ticket_status_type NOT NULL,
    changed_by      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note            VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_status_logs_ticket
  ON support_ticket_status_logs(ticket_id);

-- Seed default concerns (idempotent)
INSERT INTO support_concerns (code, label, description, sort_order, is_other)
VALUES
  ('account', 'Account / Login', 'Issues with login, profile, or account access', 10, false),
  ('match_scoring', 'Match Scoring', 'Problems with live scoring, sets, or match results', 20, false),
  ('teams', 'Teams', 'Team creation, members, roles, or logos', 30, false),
  ('tournaments', 'Tournaments', 'Tournament registration, brackets, or standings', 40, false),
  ('venues', 'Venues', 'Venue listing or location issues', 50, false),
  ('bug_report', 'Bug Report', 'Something is broken or not working as expected', 60, false),
  ('feature_request', 'Feature Request', 'Suggest a new feature or improvement', 70, false),
  ('other', 'Other', 'Something else not listed above', 100, true)
ON CONFLICT (code) DO NOTHING;
