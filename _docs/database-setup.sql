-- Base Power Survey Database Setup
-- PostgreSQL database initialization script
-- Consolidated Schema - February 2025

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS "public";

-- Create enum for survey status
CREATE TYPE "public"."Status" AS ENUM ('in_progress', 'under_review', 'completed');

-- Create surveys table
CREATE TABLE "public"."surveys" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."Status" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "step_data" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- Create unique index on user_id
CREATE UNIQUE INDEX "surveys_user_id_key" ON "public"."surveys"("user_id");

-- Create additional indexes for better performance
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_created_at ON surveys(created_at);
CREATE INDEX idx_surveys_updated_at ON surveys(updated_at);

-- Create updated_at trigger function (for Prisma compatibility)
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

-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT USAGE ON TYPE "public"."Status" TO your_app_user;

-- Verify table structure
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable,
--     column_default
-- FROM 
--     information_schema.columns
-- WHERE 
--     table_schema = 'public' 
--     AND table_name = 'surveys'
-- ORDER BY 
--     ordinal_position;

-- Example queries for development/testing:

-- Get survey by user ID
-- SELECT * FROM surveys WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Create a new survey
-- INSERT INTO surveys (user_id, current_step, status) 
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 0, 'in_progress');

-- Update survey to under review
-- UPDATE surveys SET 
--   current_step = 13,
--   status = 'under_review'
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Update survey step data
-- UPDATE surveys SET 
--   step_data = '[
--     {
--       "step_id": "1",
--       "photo_type": "meter_closeup",
--       "s3_info": "uploads/123e4567/step_1.jpg",
--       "analysis_result": {
--         "confidence": 0.95,
--         "is_valid": true,
--         "extracted_value": "200A",
--         "ai_feedback": "Successfully captured meter image"
--       }
--     }
--   ]'::jsonb
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Mark survey as completed
-- UPDATE surveys SET 
--   status = 'completed',
--   completed_at = CURRENT_TIMESTAMP
-- WHERE user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Get survey statistics by status
-- SELECT 
--   status,
--   COUNT(*) as count,
--   AVG(current_step) as avg_step,
--   MIN(created_at) as first_survey,
--   MAX(updated_at) as last_activity
-- FROM surveys 
-- GROUP BY status;

-- Get surveys in review
-- SELECT 
--   user_id,
--   current_step,
--   created_at,
--   updated_at,
--   jsonb_array_length(step_data) as completed_steps
-- FROM surveys 
-- WHERE status = 'under_review'
-- ORDER BY updated_at DESC; 