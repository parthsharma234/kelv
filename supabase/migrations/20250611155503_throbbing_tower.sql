/*
  # Add speech metrics to interview sessions

  1. Schema Updates
    - Add `speech_metrics` jsonb column to interview_sessions table
    - Add `audio_data` jsonb column for storing audio analysis results
    - Add indexes for better performance on speech metrics queries

  2. New Tables
    - `speech_analysis_cache` for caching processed audio analysis
    - `user_speech_profiles` for tracking user speech patterns over time

  3. Functions
    - Function to calculate average speech metrics across sessions
    - Function to get speech improvement trends
*/

-- Add speech metrics columns to existing interview_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'speech_metrics'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN speech_metrics jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'interview_sessions' AND column_name = 'audio_data'
  ) THEN
    ALTER TABLE interview_sessions ADD COLUMN audio_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create speech analysis cache table
CREATE TABLE IF NOT EXISTS speech_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_id text NOT NULL,
  audio_features jsonb NOT NULL,
  speech_patterns jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create user speech profiles table for tracking patterns over time
CREATE TABLE IF NOT EXISTS user_speech_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile_data jsonb NOT NULL DEFAULT '{
    "averageConfidence": 0,
    "averageFluency": 0,
    "averageSpeechRate": 0,
    "commonFillerWords": [],
    "improvementAreas": [],
    "strengths": [],
    "sessionCount": 0,
    "lastUpdated": null
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE speech_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_speech_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for speech_analysis_cache
CREATE POLICY "Users can manage own speech analysis cache"
  ON speech_analysis_cache
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_speech_profiles
CREATE POLICY "Users can manage own speech profiles"
  ON user_speech_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id AND (SELECT (raw_user_meta_data->>'is_platform_enabled')::boolean FROM auth.users WHERE id = auth.uid()) = true)
  WITH CHECK (auth.uid() = user_id AND (SELECT (raw_user_meta_data->>'is_platform_enabled')::boolean FROM auth.users WHERE id = auth.uid()) = true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS speech_analysis_cache_user_id_idx ON speech_analysis_cache(user_id);
CREATE INDEX IF NOT EXISTS speech_analysis_cache_session_id_idx ON speech_analysis_cache(session_id);
CREATE INDEX IF NOT EXISTS user_speech_profiles_user_id_idx ON user_speech_profiles(user_id);

-- Add indexes for speech metrics queries on interview_sessions
CREATE INDEX IF NOT EXISTS interview_sessions_speech_metrics_idx ON interview_sessions USING gin(speech_metrics);

-- Function to calculate average speech metrics for a user
CREATE OR REPLACE FUNCTION get_user_speech_metrics_average(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'averageConfidence', COALESCE(AVG((speech_metrics->'confidence'->>'overallConfidence')::numeric), 0),
    'averageFluency', COALESCE(AVG((speech_metrics->'fluency'->>'fluencyScore')::numeric), 0),
    'averageSpeechRate', COALESCE(AVG((speech_metrics->'timing'->>'speechRate')::numeric), 0),
    'averageVoiceStability', COALESCE(AVG((speech_metrics->'voice'->>'voiceStability')::numeric), 0),
    'sessionCount', COUNT(*),
    'lastSessionDate', MAX(created_at)
  ) INTO result
  FROM interview_sessions
  WHERE user_id = user_uuid 
    AND speech_metrics IS NOT NULL 
    AND speech_metrics != '{}'::jsonb
    AND status = 'completed';
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to get speech improvement trends
CREATE OR REPLACE FUNCTION get_speech_improvement_trends(user_uuid uuid, days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH recent_sessions AS (
    SELECT 
      created_at,
      (speech_metrics->'confidence'->>'overallConfidence')::numeric as confidence,
      (speech_metrics->'fluency'->>'fluencyScore')::numeric as fluency,
      (speech_metrics->'timing'->>'speechRate')::numeric as speech_rate,
      ROW_NUMBER() OVER (ORDER BY created_at DESC) as session_rank
    FROM interview_sessions
    WHERE user_id = user_uuid 
      AND speech_metrics IS NOT NULL 
      AND speech_metrics != '{}'::jsonb
      AND status = 'completed'
      AND created_at >= NOW() - INTERVAL '1 day' * days_back
  ),
  first_half AS (
    SELECT 
      AVG(confidence) as avg_confidence,
      AVG(fluency) as avg_fluency,
      AVG(speech_rate) as avg_speech_rate
    FROM recent_sessions
    WHERE session_rank > (SELECT COUNT(*) FROM recent_sessions) / 2
  ),
  second_half AS (
    SELECT 
      AVG(confidence) as avg_confidence,
      AVG(fluency) as avg_fluency,
      AVG(speech_rate) as avg_speech_rate
    FROM recent_sessions
    WHERE session_rank <= (SELECT COUNT(*) FROM recent_sessions) / 2
  )
  SELECT jsonb_build_object(
    'confidenceImprovement', COALESCE(s.avg_confidence - f.avg_confidence, 0),
    'fluencyImprovement', COALESCE(s.avg_fluency - f.avg_fluency, 0),
    'speechRateImprovement', COALESCE(ABS(155 - s.avg_speech_rate) - ABS(155 - f.avg_speech_rate), 0),
    'totalSessions', (SELECT COUNT(*) FROM recent_sessions),
    'analysisDate', NOW()
  ) INTO result
  FROM first_half f, second_half s;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to update user speech profile
CREATE OR REPLACE FUNCTION update_user_speech_profile(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_metrics jsonb;
  improvement_trends jsonb;
  updated_profile jsonb;
BEGIN
  -- Get average metrics
  SELECT get_user_speech_metrics_average(user_uuid) INTO avg_metrics;
  
  -- Get improvement trends
  SELECT get_speech_improvement_trends(user_uuid) INTO improvement_trends;
  
  -- Build updated profile
  SELECT jsonb_build_object(
    'averageConfidence', avg_metrics->>'averageConfidence',
    'averageFluency', avg_metrics->>'averageFluency',
    'averageSpeechRate', avg_metrics->>'averageSpeechRate',
    'averageVoiceStability', avg_metrics->>'averageVoiceStability',
    'sessionCount', avg_metrics->>'sessionCount',
    'lastSessionDate', avg_metrics->>'lastSessionDate',
    'improvementTrends', improvement_trends,
    'lastUpdated', NOW()
  ) INTO updated_profile;
  
  -- Upsert the profile
  INSERT INTO user_speech_profiles (user_id, profile_data)
  VALUES (user_uuid, updated_profile)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    profile_data = updated_profile,
    updated_at = NOW();
END;
$$;

-- Trigger to automatically update speech profile when session is completed
CREATE OR REPLACE FUNCTION trigger_update_speech_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if this is a completed session with speech metrics
  IF NEW.status = 'completed' AND NEW.speech_metrics IS NOT NULL AND NEW.speech_metrics != '{}'::jsonb THEN
    PERFORM update_user_speech_profile(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic profile updates
DROP TRIGGER IF EXISTS update_speech_profile_trigger ON interview_sessions;
CREATE TRIGGER update_speech_profile_trigger
  AFTER INSERT OR UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_speech_profile();

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_speech_metrics_average(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_speech_improvement_trends(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_speech_profile(uuid) TO authenticated;