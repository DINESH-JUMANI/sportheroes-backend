-- Migration 10: Add Table Tennis specific columns to match_points
-- Run: npm run db:migrate -- 10.add_tt_fields.sql

CREATE TYPE point_type AS ENUM ('normal', 'service_fault', 'let');

ALTER TABLE match_points ADD COLUMN point_type point_type NOT NULL DEFAULT 'normal';
ALTER TABLE match_points ADD COLUMN server_side match_side_type;
