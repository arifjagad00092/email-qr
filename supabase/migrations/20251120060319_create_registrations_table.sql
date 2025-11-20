/*
  # Create Registrations Tracking System

  1. New Tables
    - `registrations`
      - `id` (uuid, primary key)
      - `email` (text, unique per event)
      - `first_name` (text)
      - `last_name` (text)
      - `event_api_id` (text)
      - `status` (text) - pending, code_sent, signed_in, completed, failed
      - `verification_code` (text, nullable)
      - `luma_response` (jsonb, nullable)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `registrations` table
    - Add policy for authenticated users to manage registrations
  
  3. Indexes
    - Index on email for faster lookups
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  event_api_id text DEFAULT 'evt-nTA5QQPkL5SrU9g',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'code_sent', 'signed_in', 'completed', 'failed')),
  verification_code text,
  luma_response jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on email per event
CREATE UNIQUE INDEX IF NOT EXISTS registrations_email_event_idx ON registrations(email, event_api_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations(status);
CREATE INDEX IF NOT EXISTS registrations_created_at_idx ON registrations(created_at DESC);

-- Enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view all registrations
CREATE POLICY "Authenticated users can view registrations"
  ON registrations
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert registrations
CREATE POLICY "Authenticated users can insert registrations"
  ON registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update registrations
CREATE POLICY "Authenticated users can update registrations"
  ON registrations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to delete registrations
CREATE POLICY "Authenticated users can delete registrations"
  ON registrations
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();