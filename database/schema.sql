-- PostgreSQL schema for Policy Tracker application

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE policy_category AS ENUM ('insurance', 'health', 'vehicle', 'tax_saving');
CREATE TYPE notification_channel AS ENUM ('push', 'sms', 'email');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'skipped');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    relationship VARCHAR(80) NOT NULL,
    date_of_birth DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
    category policy_category NOT NULL,
    provider_name VARCHAR(150) NOT NULL,
    policy_number VARCHAR(120) NOT NULL,
    premium_amount NUMERIC(12,2) NOT NULL CHECK (premium_amount > 0),
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_policy_dates CHECK (end_date > start_date),
    CONSTRAINT uq_user_policy_number UNIQUE (user_id, policy_number)
);

CREATE TABLE policy_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    storage_bucket VARCHAR(120) NOT NULL,
    object_key TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120),
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_policy_object UNIQUE (policy_id, object_key)
);

CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    push_token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_push_token UNIQUE (user_id, push_token)
);

CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_offset_days INT NOT NULL CHECK (reminder_offset_days IN (30, 15, 3)),
    due_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_policy_offset UNIQUE (policy_id, reminder_offset_days)
);

CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES notification_schedule(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    idempotency_key TEXT NOT NULL,
    CONSTRAINT uq_notification_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX idx_policies_user_id ON policies(user_id);
CREATE INDEX idx_policies_end_date ON policies(end_date);
CREATE INDEX idx_notification_schedule_due_at ON notification_schedule(due_at) WHERE processed_at IS NULL;
CREATE INDEX idx_notification_schedule_policy ON notification_schedule(policy_id);
CREATE INDEX idx_notification_log_policy ON notification_log(policy_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);

-- Helper query to (re)build reminder schedule for a policy
-- INSERT INTO notification_schedule (policy_id, user_id, reminder_offset_days, due_at)
-- SELECT p.id, p.user_id, o.offset_days, (p.end_date - (o.offset_days || ' days')::interval)
-- FROM policies p
-- CROSS JOIN (VALUES (30), (15), (3)) AS o(offset_days)
-- WHERE p.id = :policy_id
-- ON CONFLICT (policy_id, reminder_offset_days)
-- DO UPDATE SET due_at = EXCLUDED.due_at, processed_at = NULL;
