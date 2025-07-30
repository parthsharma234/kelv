-- Add comprehensive body language analysis tables for real-time analysis
-- Including posture, facial expressions, emotions, and gestures

-- Table for storing detailed body language analysis data
CREATE TABLE IF NOT EXISTS body_language_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Analysis metadata
    total_duration DECIMAL NOT NULL,
    analysis_interval_ms INTEGER DEFAULT 500,
    total_frames INTEGER NOT NULL,
    
    -- Summary metrics (for quick display)
    avg_posture_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    eye_contact_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    avg_hand_movement_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    avg_fidgeting_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    
    -- Facial expression metrics
    avg_confidence_expression DECIMAL(3,2) NOT NULL DEFAULT 0,
    avg_engagement_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    smile_frequency DECIMAL(5,2) NOT NULL DEFAULT 0,
    dominant_emotion VARCHAR(50),
    
    -- Voice-visual synchronization
    gesture_speech_alignment DECIMAL(3,2) NOT NULL DEFAULT 0,
    
    -- Overall scores
    overall_body_language_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    overall_facial_expression_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    overall_professionalism_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    
    -- Key insights
    top_posture_moments JSONB, -- Array of {timestamp, score, description}
    problem_areas JSONB, -- Array of issues identified
    recommendations JSONB -- Array of improvement suggestions
);

-- Table for timestamped body language data points
CREATE TABLE IF NOT EXISTS body_language_timeline (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    body_language_analysis_id UUID NOT NULL REFERENCES body_language_analysis(id) ON DELETE CASCADE,
    timestamp_ms INTEGER NOT NULL, -- Milliseconds from start
    timestamp_formatted TEXT NOT NULL, -- HH:MM:SS.mmm format
    
    -- Core posture metrics
    posture_score DECIMAL(3,2) NOT NULL,
    eye_contact BOOLEAN NOT NULL,
    hand_movement_score DECIMAL(3,2) NOT NULL,
    fidgeting_score DECIMAL(3,2) NOT NULL,
    
    -- Facial expression metrics
    facial_expressions JSONB, -- {happy, sad, angry, surprised, neutral, etc.}
    confidence_expression DECIMAL(3,2) NOT NULL DEFAULT 0,
    engagement_level DECIMAL(3,2) NOT NULL DEFAULT 0,
    smile_detected BOOLEAN NOT NULL DEFAULT FALSE,
    blink_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    
    -- Micro-expressions and authenticity
    micro_expression_detected VARCHAR(50),
    authenticity_score DECIMAL(3,2) NOT NULL DEFAULT 0,
    stress_indicators JSONB, -- Array of detected stress signs
    
    -- Detailed posture breakdowns
    head_pose JSONB, -- {yaw, pitch, roll}
    shoulder_alignment DECIMAL(3,2),
    back_straightness DECIMAL(3,2),
    hand_positions JSONB, -- Array of hand landmark positions
    movement_velocity DECIMAL(5,2), -- Overall movement speed
    
    -- Gesture analysis
    gesture_detected VARCHAR(100), -- Type of gesture if any
    gesture_confidence DECIMAL(3,2),
    gesture_appropriateness DECIMAL(3,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_body_language_analysis_session_id ON body_language_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_body_language_timeline_analysis_id ON body_language_timeline(body_language_analysis_id);
CREATE INDEX IF NOT EXISTS idx_body_language_timeline_timestamp ON body_language_timeline(timestamp_ms);

-- Add RLS policies
ALTER TABLE body_language_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_language_timeline ENABLE ROW LEVEL SECURITY;

-- Users can only access their own body language analysis data
CREATE POLICY "Users can view their own body language analysis" ON body_language_analysis
    FOR SELECT USING (
        session_id IN (
            SELECT id FROM interview_sessions WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own body language timeline" ON body_language_timeline
    FOR SELECT USING (
        body_language_analysis_id IN (
            SELECT bla.id FROM body_language_analysis bla
            JOIN interview_sessions i ON bla.session_id = i.id
            WHERE i.user_id = auth.uid()
        )
    );

-- Service role can insert/update body language analysis data
CREATE POLICY "Service role can manage body language analysis" ON body_language_analysis
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage body language timeline" ON body_language_timeline
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_body_language_analysis_updated_at BEFORE UPDATE ON body_language_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();