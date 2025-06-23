-- Create college_interview_setups table for saving college interview configurations
CREATE TABLE IF NOT EXISTS college_interview_setups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    setup JSONB NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS college_interview_setups_user_id_idx ON college_interview_setups(user_id);
CREATE INDEX IF NOT EXISTS college_interview_setups_is_favorite_idx ON college_interview_setups(is_favorite);
CREATE INDEX IF NOT EXISTS college_interview_setups_updated_at_idx ON college_interview_setups(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE college_interview_setups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own college interview setups" ON college_interview_setups
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own college interview setups" ON college_interview_setups
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own college interview setups" ON college_interview_setups
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own college interview setups" ON college_interview_setups
    FOR DELETE USING (auth.uid() = user_id);

-- Add comment to describe the table
COMMENT ON TABLE college_interview_setups IS 'Stores saved college interview setup configurations for users';
