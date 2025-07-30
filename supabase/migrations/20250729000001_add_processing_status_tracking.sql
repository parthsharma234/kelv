-- Add processing status tracking to realtime interview sessions
ALTER TABLE realtime_interview_sessions 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_metadata JSONB DEFAULT NULL,
ADD CONSTRAINT realtime_interview_sessions_processing_status_check 
    CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add comment explaining the columns
COMMENT ON COLUMN realtime_interview_sessions.processing_status IS 'Current status of post-interview processing (pending, processing, completed, failed)';
COMMENT ON COLUMN realtime_interview_sessions.processing_metadata IS 'Metadata about processing progress including timestamps, progress percentage, and any error details';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_processing_status 
ON realtime_interview_sessions(processing_status);

-- Add a function to automatically update processing_metadata timestamps
CREATE OR REPLACE FUNCTION update_processing_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.processing_status != OLD.processing_status THEN
        NEW.processing_metadata = jsonb_set(
            COALESCE(NEW.processing_metadata, '{}'::jsonb),
            '{last_updated}',
            to_jsonb(NOW())
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update processing metadata
CREATE TRIGGER update_processing_metadata_timestamp
    BEFORE UPDATE ON realtime_interview_sessions
    FOR EACH ROW
    WHEN (NEW.processing_status IS DISTINCT FROM OLD.processing_status)
    EXECUTE FUNCTION update_processing_metadata();
