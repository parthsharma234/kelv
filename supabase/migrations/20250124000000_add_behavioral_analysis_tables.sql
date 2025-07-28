-- Add behavioral analysis tables for realtime interviews
-- This migration adds tables for storing behavioral insights and summaries

-- Create behavioral_insights table
CREATE TABLE IF NOT EXISTS behavioral_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES realtime_interview_sessions(session_id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    response_time INTEGER NOT NULL, -- in milliseconds
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    engagement TEXT NOT NULL CHECK (engagement IN ('high', 'medium', 'low')),
    communication_style TEXT NOT NULL CHECK (communication_style IN ('structured', 'conversational', 'formal', 'casual')),
    stress_indicators BOOLEAN NOT NULL DEFAULT false,
    question_context TEXT,
    timestamp BIGINT NOT NULL, -- Unix timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create behavioral_summaries table
CREATE TABLE IF NOT EXISTS behavioral_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES realtime_interview_sessions(session_id) ON DELETE CASCADE,
    total_responses INTEGER NOT NULL DEFAULT 0,
    average_confidence DECIMAL(3,1) NOT NULL DEFAULT 0,
    average_engagement DECIMAL(3,1) NOT NULL DEFAULT 0,
    dominant_communication_style TEXT NOT NULL DEFAULT 'conversational',
    stress_indicators_count INTEGER NOT NULL DEFAULT 0,
    confidence_trend TEXT NOT NULL CHECK (confidence_trend IN ('improving', 'declining', 'stable')) DEFAULT 'stable',
    engagement_trend TEXT NOT NULL CHECK (engagement_trend IN ('improving', 'declining', 'stable')) DEFAULT 'stable',
    overall_behavioral_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_behavioral_score >= 0 AND overall_behavioral_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_session_id ON behavioral_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_insights_timestamp ON behavioral_insights(timestamp);
CREATE INDEX IF NOT EXISTS idx_behavioral_summaries_session_id ON behavioral_summaries(session_id);

-- Add RLS policies
ALTER TABLE behavioral_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_summaries ENABLE ROW LEVEL SECURITY;

-- Policy for behavioral_insights
CREATE POLICY "Users can view their own behavioral insights" ON behavioral_insights
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM realtime_interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own behavioral insights" ON behavioral_insights
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT session_id FROM realtime_interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

-- Policy for behavioral_summaries
CREATE POLICY "Users can view their own behavioral summaries" ON behavioral_summaries
    FOR SELECT USING (
        session_id IN (
            SELECT session_id FROM realtime_interview_sessions 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own behavioral summaries" ON behavioral_summaries
    FOR INSERT WITH CHECK (
        session_id IN (
            SELECT session_id FROM realtime_interview_sessions 
            WHERE user_id = auth.uid()
        )
    ); 