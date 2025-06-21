/*
  # Add interview_type column to interview_sessions table
  
  This migration adds the interview_type column to support focused interviews.
  This column will store the type of interview (technical, behavioral, etc.)
  to enable proper routing and display in the dashboard.
*/

-- Add interview_type column to interview_sessions table
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS interview_type text;

-- Create index for better performance on interview type queries
CREATE INDEX IF NOT EXISTS interview_sessions_interview_type_idx 
ON interview_sessions(interview_type);

-- Update the saveInterviewSession function to handle interview_type
-- (This will be used by the application to save the interview type)
