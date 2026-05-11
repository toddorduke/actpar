-- Add pricing fields to community events
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT 0;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd';
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS stripe_payment_link text;
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS max_attendees integer;

-- Track payment status on RSVPs
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free'
  CHECK (payment_status IN ('free', 'pending', 'paid'));
