CREATE TABLE IF NOT EXISTS data_driver_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  created_at timestamptz DEFAULT now(),
  source text DEFAULT 'data-driver-demo',
  status text DEFAULT 'waitlist',
  synced_to_ghl boolean DEFAULT false,
  ghl_contact_id text
);

ALTER TABLE data_driver_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon inserts" ON data_driver_leads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow service reads" ON data_driver_leads FOR SELECT TO service_role USING (true);
