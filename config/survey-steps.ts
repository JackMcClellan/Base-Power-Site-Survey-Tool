// This file re-exports frontend-safe step configuration from the backend
// The single source of truth is in lib/survey-steps-config.ts

import { 
  SURVEY_STEPS_FRONTEND, 
  CAMERA_STEPS_FRONTEND,
  type SurveyStepFrontend 
} from '@/lib/survey-steps-config'

// Re-export types for backward compatibility
export type SurveyStep = SurveyStepFrontend
export type CameraConfig = Record<string, never>

// Re-export the frontend-safe steps from the backend configuration
export const SURVEY_STEPS = SURVEY_STEPS_FRONTEND
export const CAMERA_STEPS = CAMERA_STEPS_FRONTEND 