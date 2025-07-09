-- Add realtime interview support tables
-- This migration adds tables for storing realtime interview transcripts and session metadata

-- Table for storing individual transcript chunks
CREATE TABLE IF NOT EXISTS transcript_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'assistant')),
  text TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  is_partial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing realtime session metadata
CREATE TABLE IF NOT EXISTS realtime_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  setup JSONB NOT NULL,
  interview_type TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'error')),
  model_type TEXT NOT NULL DEFAULT 'gpt-4o-realtime-preview-2024-10-01',
  total_duration INTEGER NOT NULL DEFAULT 0,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_session_id ON transcript_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_transcript_chunks_timestamp ON transcript_chunks(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_user_id ON realtime_interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_status ON realtime_interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_realtime_sessions_created_at ON realtime_interview_sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE transcript_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_interview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transcript_chunks
CREATE POLICY "Users can view their own transcript chunks" ON transcript_chunks
  FOR SELECT
  USING (
    session_id IN (
      SELECT session_id FROM realtime_interview_sessions 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own transcript chunks" ON transcript_chunks
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM realtime_interview_sessions 
      WHERE user_id = auth.uid()
    )
  );

-- RLS policies for realtime_interview_sessions
CREATE POLICY "Users can view their own realtime sessions" ON realtime_interview_sessions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own realtime sessions" ON realtime_interview_sessions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own realtime sessions" ON realtime_interview_sessions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for realtime_interview_sessions
CREATE TRIGGER update_realtime_sessions_updated_at
  BEFORE UPDATE ON realtime_interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
