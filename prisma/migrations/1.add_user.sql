-- Migration 1: Identity & auth foundation
-- Run: psql "<DATABASE_URL>" -f prisma/migrations/1.add_user.sql
-- Creates gender enum and users table (Firebase phone auth identity)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE,
    phone_number        VARCHAR(20),
    full_name           VARCHAR(150) NOT NULL,
    display_name        VARCHAR(50),
    profile_picture_url TEXT,
    date_of_birth       DATE,
    gender              gender_type,
    city                VARCHAR(100),
    state               VARCHAR(100),
    country             VARCHAR(100),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
