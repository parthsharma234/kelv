/*
  # Add interview setups table for user profiles

  1. New Tables
    - `interview_setups`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, user-defined name for the setup)
      - `setup` (jsonb, contains industry, jobType, experienceLevel)
      - `is_favorite` (boolean, whether this is a favorite setup)
      - `usage_count` (integer, how many times this setup has been used)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `interview_setups` table
    - Add policy for authenticated users to manage their own setups

  3. Functions
    - Add trigger to update updated_at timestamp
*/

CREATE TABLE IF NOT EXISTS interview_setups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  setup jsonb NOT NULL,
  is_favorite boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interview_setups ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own interview setups
CREATE POLICY "Users can manage own interview setups"
  ON interview_setups
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_interview_setups_updated_at
  BEFORE UPDATE ON interview_setups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for better performance
CREATE INDEX IF NOT EXISTS interview_setups_user_id_idx ON interview_setups(user_id);
CREATE INDEX IF NOT EXISTS interview_setups_favorite_idx ON interview_setups(user_id, is_favorite) WHERE is_favorite = true;