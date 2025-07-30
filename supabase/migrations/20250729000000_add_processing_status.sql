-- Add processing status tracking to realtime interview sessions
ALTER TABLE realtime_interview_sessions 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_error TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT NULL;

-- Add comment for the new column
COMMENT ON COLUMN realtime_interview_sessions.processing_status IS 'Status of post-interview processing (pending, processing, completed, failed)';
COMMENT ON COLUMN realtime_interview_sessions.processing_error IS 'Error message if processing failed';
COMMENT ON COLUMN realtime_interview_sessions.processing_metadata IS 'Additional metadata about processing progress';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_processing_status 
ON realtime_interview_sessions(processing_status);

-- Update the status check to include processing status values
ALTER TABLE realtime_interview_sessions 
ADD CONSTRAINT realtime_interview_sessions_processing_status_check 
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));
