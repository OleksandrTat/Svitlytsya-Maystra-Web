-- ============================================================
-- CRM REDESIGN: contacts + deals + deal_messages
-- Replaces: inquiries (pre-sale) + orders (production) merged
-- into one unified pipeline.
-- Old tables are KEPT for backward compatibility.
-- ============================================================

-- ── CONTACTS ────────────────────────────────────────────────
-- Represents every person who has ever contacted the business.
-- May or may not have a registered user account.

CREATE TABLE IF NOT EXISTS contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  phone           text,
  email           text,
  source          text NOT NULL DEFAULT 'manual', -- web_form | phone | direct | referral | manual
  notes           text,
  linked_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_phone_idx   ON contacts (phone);
CREATE INDEX IF NOT EXISTS contacts_email_idx   ON contacts (email);
CREATE INDEX IF NOT EXISTS contacts_user_idx    ON contacts (linked_user_id);
CREATE INDEX IF NOT EXISTS contacts_activity_idx ON contacts (last_activity_at DESC);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on contacts"
  ON contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── DEALS ────────────────────────────────────────────────────
-- A deal is a single business opportunity from first contact
-- to project completion. Replaces both inquiries + orders.

CREATE TYPE deal_stage AS ENUM (
  'lead',         -- new inquiry / first contact
  'contacted',    -- we reached out
  'quoted',       -- estimate sent
  'consulting',   -- active consultation
  'design',       -- design in progress
  'approved',     -- client approved design
  'production',   -- in production
  'ready',        -- ready for delivery/installation
  'installation', -- being installed
  'completed',    -- project done
  'lost',         -- client declined
  'archived'      -- archived
);

CREATE TYPE deal_priority AS ENUM ('normal', 'urgent');

CREATE TABLE IF NOT EXISTS deals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      uuid NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  title           text NOT NULL,                -- e.g. "Двері на кухню"
  service_type    text,                         -- Двері / Меблі / Вікна / Реставрація
  stage           deal_stage NOT NULL DEFAULT 'lead',
  priority        deal_priority NOT NULL DEFAULT 'normal',
  value           numeric(12, 2),               -- expected deal value (UAH)
  expected_date   date,                         -- expected completion date
  internal_notes  text,
  -- links to old tables (for migration, nullable)
  inquiry_id      uuid REFERENCES inquiries(id) ON DELETE SET NULL,
  order_id        uuid REFERENCES orders(id)    ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deals_contact_idx   ON deals (contact_id);
CREATE INDEX IF NOT EXISTS deals_stage_idx     ON deals (stage);
CREATE INDEX IF NOT EXISTS deals_updated_idx   ON deals (updated_at DESC);
CREATE INDEX IF NOT EXISTS deals_inquiry_idx   ON deals (inquiry_id);
CREATE INDEX IF NOT EXISTS deals_order_idx     ON deals (order_id);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on deals"
  ON deals FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION touch_deals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION touch_deals_updated_at();

-- ── DEAL_MESSAGES ────────────────────────────────────────────
-- Unified messaging for deals.
-- Replaces: order_messages + support_messages/chats.

CREATE TYPE deal_message_sender AS ENUM ('client', 'admin', 'system');
CREATE TYPE deal_message_channel AS ENUM ('internal', 'viber', 'whatsapp', 'email', 'phone_note');

CREATE TABLE IF NOT EXISTS deal_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_type deal_message_sender  NOT NULL DEFAULT 'admin',
  sender_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel     deal_message_channel NOT NULL DEFAULT 'internal',
  content     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_messages_deal_idx    ON deal_messages (deal_id, created_at ASC);
CREATE INDEX IF NOT EXISTS deal_messages_unread_idx  ON deal_messages (is_read, sender_type);

ALTER TABLE deal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on deal_messages"
  ON deal_messages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── DEAL_STAGE_HISTORY ───────────────────────────────────────
-- Audit trail of stage changes (mirrors order_status_history).

CREATE TABLE IF NOT EXISTS deal_stage_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  from_stage  deal_stage,
  to_stage    deal_stage NOT NULL,
  comment     text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deal_stage_history_deal_idx ON deal_stage_history (deal_id, created_at ASC);

ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on deal_stage_history"
  ON deal_stage_history FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── DATA MIGRATION ───────────────────────────────────────────
-- Backfill contacts + deals from existing inquiries.
-- Run once; safe to re-run (ON CONFLICT DO NOTHING).

-- 1. Create contacts from inquiries (dedup by phone)
INSERT INTO contacts (id, name, phone, email, source, created_at, last_activity_at)
SELECT
  gen_random_uuid(),
  name,
  phone,
  email,
  channel::text,
  MIN(created_at),
  MAX(created_at)
FROM inquiries
WHERE name IS NOT NULL AND name != ''
GROUP BY name, phone, email, channel::text
ON CONFLICT DO NOTHING;

-- 2. Create deals from inquiries
-- Map inquiry status → deal stage
INSERT INTO deals (contact_id, title, service_type, stage, priority, internal_notes, inquiry_id, created_at, updated_at)
SELECT
  c.id,
  COALESCE(i.service_type, 'Загальне'),
  i.service_type,
  CASE i.status
    WHEN 'new'        THEN 'lead'::deal_stage
    WHEN 'contacted'  THEN 'contacted'::deal_stage
    WHEN 'quoted'     THEN 'quoted'::deal_stage
    WHEN 'in_progress'THEN 'consulting'::deal_stage
    WHEN 'won'        THEN 'completed'::deal_stage
    WHEN 'done'       THEN 'completed'::deal_stage
    WHEN 'lost'       THEN 'lost'::deal_stage
    WHEN 'archived'   THEN 'archived'::deal_stage
    ELSE 'lead'::deal_stage
  END,
  'normal'::deal_priority,
  i.message,
  i.id,
  i.created_at,
  i.created_at
FROM inquiries i
JOIN contacts c ON (c.phone = i.phone OR (c.phone IS NULL AND i.phone IS NULL))
  AND c.name = i.name
ON CONFLICT DO NOTHING;

-- 3. Create deals from orders (those not already linked via inquiry)
INSERT INTO deals (contact_id, title, service_type, stage, priority, expected_date, internal_notes, order_id, created_at, updated_at)
SELECT
  c.id,
  COALESCE(o.order_number, 'Замовлення'),
  NULL,
  CASE o.status
    WHEN 'new'          THEN 'lead'::deal_stage
    WHEN 'consulting'   THEN 'consulting'::deal_stage
    WHEN 'design'       THEN 'design'::deal_stage
    WHEN 'approved'     THEN 'approved'::deal_stage
    WHEN 'production'   THEN 'production'::deal_stage
    WHEN 'ready'        THEN 'ready'::deal_stage
    WHEN 'installation' THEN 'installation'::deal_stage
    WHEN 'completed'    THEN 'completed'::deal_stage
    WHEN 'archived'     THEN 'archived'::deal_stage
    ELSE 'consulting'::deal_stage
  END,
  o.priority::text::deal_priority,
  o.expected_date::date,
  o.internal_notes,
  o.id,
  o.created_at,
  o.updated_at
FROM orders o
LEFT JOIN inquiries i ON i.id = o.inquiry_id
LEFT JOIN deals existing_deal ON existing_deal.order_id = o.id
-- find a contact by linked inquiry or create a fallback
LEFT JOIN contacts c ON c.id = (
  SELECT d.contact_id FROM deals d WHERE d.inquiry_id = o.inquiry_id LIMIT 1
)
WHERE existing_deal.id IS NULL
  AND c.id IS NOT NULL
ON CONFLICT DO NOTHING;
