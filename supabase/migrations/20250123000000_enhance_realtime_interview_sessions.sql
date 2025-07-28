-- Enhance realtime_interview_sessions table to store complete interview data
-- This migration adds columns to store responses, scores, metrics, and other data
-- so realtime interviews can be displayed in the dashboard alongside regular interviews

-- Add columns to store complete interview data
ALTER TABLE realtime_interview_sessions 
ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS overall_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speech_metrics JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS voice_metrics_summary JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS voice_timeline JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS session_metadata JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transcript JSONB DEFAULT NULL;

-- Add comments to describe the new columns
COMMENT ON COLUMN realtime_interview_sessions.responses IS 'Array of interview responses with analysis';
COMMENT ON COLUMN realtime_interview_sessions.questions IS 'Array of questions asked during the interview';
COMMENT ON COLUMN realtime_interview_sessions.overall_score IS 'Overall interview score (0-100)';
COMMENT ON COLUMN realtime_interview_sessions.questions_answered IS 'Number of questions answered';
COMMENT ON COLUMN realtime_interview_sessions.speech_metrics IS 'Speech analysis metrics and data';
COMMENT ON COLUMN realtime_interview_sessions.voice_metrics_summary IS 'Summary of voice analysis metrics';
COMMENT ON COLUMN realtime_interview_sessions.voice_timeline IS 'Timeline of voice analysis data';
COMMENT ON COLUMN realtime_interview_sessions.metrics IS 'Interview-specific metrics (clarity, relevance, etc.)';
COMMENT ON COLUMN realtime_interview_sessions.session_metadata IS 'Additional session metadata';
COMMENT ON COLUMN realtime_interview_sessions.transcript IS 'Full interview transcript';

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_overall_score ON realtime_interview_sessions(overall_score);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_questions_answered ON realtime_interview_sessions(questions_answered);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_interview_type ON realtime_interview_sessions(interview_type);

-- Update the status check to include 'completed' status
ALTER TABLE realtime_interview_sessions 
DROP CONSTRAINT IF EXISTS realtime_interview_sessions_status_check;

ALTER TABLE realtime_interview_sessions 
ADD CONSTRAINT realtime_interview_sessions_status_check 
CHECK (status IN ('active', 'paused', 'completed', 'error')); 