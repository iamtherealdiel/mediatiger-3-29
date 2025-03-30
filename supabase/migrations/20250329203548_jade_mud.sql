/*
  # Add Payouts Table
  
  1. New Tables
    - `payouts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `status` (text)
      - `payout_date` (timestamptz)
      - `method` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for users to view their own payouts
    - Add policies for admins to manage payouts
*/

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date timestamptz NOT NULL,
  method text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payouts"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage payouts"
  ON payouts
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'service_role' OR 
    auth.jwt() ->> 'role' = 'supabase_admin'
  );

-- Create indexes for better performance
CREATE INDEX idx_payouts_user_date 
ON payouts(user_id, payout_date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payout_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_payout_timestamp
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_payout_updated_at();