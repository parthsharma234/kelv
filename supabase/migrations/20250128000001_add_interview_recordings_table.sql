-- Create interview recordings table
CREATE TABLE IF NOT EXISTS interview_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    duration INTEGER NOT NULL, -- Duration in seconds
    file_size BIGINT NOT NULL, -- File size in bytes
    mime_type TEXT NOT NULL DEFAULT 'video/webm',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_recordings_user_id ON interview_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_session_id ON interview_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_recordings_created_at ON interview_recordings(created_at DESC);

-- Enable RLS
ALTER TABLE interview_recordings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own recordings
CREATE POLICY "Users can view their own interview recordings" ON interview_recordings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own interview recordings" ON interview_recordings
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own interview recordings" ON interview_recordings
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own interview recordings" ON interview_recordings
    FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for interview recordings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('interview-recordings', 'interview-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Users can upload their own interview recordings" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'interview-recordings' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own interview recordings" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'interview-recordings' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own interview recordings" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'interview-recordings' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_interview_recordings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_recordings_updated_at 
    BEFORE UPDATE ON interview_recordings
    FOR EACH ROW EXECUTE FUNCTION update_interview_recordings_updated_at();