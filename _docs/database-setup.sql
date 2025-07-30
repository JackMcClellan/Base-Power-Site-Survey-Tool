-- Database setup for Base Power Site Survey Tool
-- PostgreSQL schema for survey data persistence

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    current_step INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    -- Survey data fields (stored as JSONB for flexibility)
    meter_photos JSONB,
    analysis_results JSONB,
    survey_responses JSONB,
    
    -- Metadata fields
    device_info JSONB,
    session_metadata JSONB,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed')),
    CONSTRAINT valid_step CHECK (current_step >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at);
CREATE INDEX IF NOT EXISTS idx_surveys_updated_at ON surveys(updated_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO surveys (user_id, current_step, status) 
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 0, 'in_progress');

-- Check the table structure
-- \d surveys;

-- Verify indexes
-- \di surveys*;

-- Example queries for development/testing:

-- Get survey by user ID
-- SELECT * FROM surveys WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Update survey step
-- UPDATE surveys SET current_step = 1 WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Update survey data
-- UPDATE surveys SET 
--   meter_photos = '{"step1": {"fileName": "meter-001.jpg", "uploadedAt": "2024-01-01T00:00:00Z"}}',
--   analysis_results = '{"step1": {"passed": true, "confidence": 0.95}}'
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Mark survey as completed
-- UPDATE surveys SET 
--   status = 'completed',
--   current_step = 99,
--   completed_at = CURRENT_TIMESTAMP
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Get survey statistics
-- SELECT 
--   status,
--   COUNT(*) as count,
--   AVG(current_step) as avg_step,
--   MIN(created_at) as first_survey,
--   MAX(updated_at) as last_activity
-- FROM surveys 
-- GROUP BY status; 