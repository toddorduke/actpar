-- Add spark_message column to connections table.
-- A spark is a connection request that includes a personal message.
-- Regular connects (checkmark) leave this NULL.
ALTER TABLE connections ADD COLUMN IF NOT EXISTS spark_message text;
