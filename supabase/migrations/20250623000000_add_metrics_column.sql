-- Add metrics column for interview-specific metrics
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT NULL;

-- Add comment to describe the metrics column
COMMENT ON COLUMN interview_sessions.metrics IS 'Interview specific metrics like authenticity, passion, clarity, etc.';
