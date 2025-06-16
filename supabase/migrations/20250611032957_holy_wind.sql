/*
  # Create interview sessions table

  1. New Tables
    - `interview_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `setup` (jsonb, interview configuration)
      - `responses` (jsonb, array of responses and analysis)
      - `overall_score` (integer, final score)
      - `duration` (integer, duration in seconds)
      - `questions_answered` (integer, number of questions)
      - `status` (text, completed/incomplete)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `interview_sessions` table
    - Add policy for users to manage their own sessions
*/

CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  setup jsonb NOT NULL,
  responses jsonb DEFAULT '[]'::jsonb,
  overall_score integer DEFAULT 0,
  duration integer DEFAULT 0,
  questions_answered integer DEFAULT 0,
  status text DEFAULT 'incomplete' CHECK (status IN ('completed', 'incomplete')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own interview sessions
CREATE POLICY "Users can manage own interview sessions"
  ON interview_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND (SELECT (raw_user_meta_data->>'is_platform_enabled')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK (auth.uid() = user_id AND (SELECT (raw_user_meta_data->>'is_platform_enabled')::boolean FROM auth.users WHERE id = auth.uid()) = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();