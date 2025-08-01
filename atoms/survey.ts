import { atom } from 'jotai'
import { SURVEY_STEPS, CAMERA_STEPS, type SurveyStep } from '@/config/survey-steps'

// Basic analysis result interface for immediate UI feedback
export interface AnalysisResult {
  isValid: boolean
  message: string
  confidence: number
  extractedValue?: string  // Optional - only present for data extraction steps
}

// Survey step state - starts at 0 for welcome page
export const currentStepAtom = atom<number>(0)

// Survey ID provider atom
export const surveyIdAtom = atom<string | null>(null)

// Retake mode atom - tracks if user is retaking from review
export const retakeModeAtom = atom<{
  isRetaking: boolean
  returnToReview: boolean
  originalStep?: number
}>({
  isRetaking: false,
  returnToReview: false
})

// Simple validation result for UI feedback
interface ValidationResult {
  passed: boolean
  confidence: number
  message: string
}

// Minimal step data for frontend state (before backend sync)
interface StepData {
  timestamp: Date
  action: 'capture' | 'skip' | 'retry'
  validated: boolean
  validationResult?: ValidationResult
  // Image will be uploaded to S3, only keep reference
  imageUploaded: boolean
  retryCount: number
  extractedValue?: string
  structuredData?: Record<string, string>
}

// Lightweight survey state for frontend
export const surveyDataAtom = atom<{
  stepData: Record<number, StepData>
  startTime: Date | null
  completedSteps: number[]
  // Backend will manage the full survey data
  surveyId?: string
  currentlySyncing: boolean
}>({
  stepData: {},
  startTime: null,
  completedSteps: [],
  currentlySyncing: false
})

// Survey steps configuration - use CAMERA_STEPS for components that need to filter out guides
export const surveyStepsAtom = atom<SurveyStep[]>(CAMERA_STEPS)

// Export types for components
export type { SurveyStep } from '@/config/survey-steps'
export type { StepData, ValidationResult }

// Helper function to get the correct step sequence including guides
const getStepSequence = (): number[] => {
  return SURVEY_STEPS
    .map(step => step.id)
    .sort((a, b) => a - b)
}

// Derived atoms for UI state
export const currentStepDataAtom = atom((get) => {
  const currentStepId = get(currentStepAtom)
  
  // Find the step in SURVEY_STEPS by ID
  const step = SURVEY_STEPS.find(s => s.id === currentStepId)
  
  // Return the found step or fallback to first camera step
  if (step) {
    return step
  }
  
  // Fallback to first camera step if current step not found
  return CAMERA_STEPS[0]
})

// Progress calculation for UI - only count camera/data-entry steps
export const surveyProgressAtom = atom((get) => {
  const currentStepId = get(currentStepAtom)
  const steps = get(surveyStepsAtom) // This is CAMERA_STEPS (excludes guides)
  
  // Find current step index in camera steps only
  let currentStepNumber = 0
  const stepIndex = steps.findIndex(step => step.id === currentStepId)
  
  if (stepIndex >= 0) {
    currentStepNumber = stepIndex + 1
  } else if (currentStepId > steps[steps.length - 1]?.id) {
    currentStepNumber = steps.length
  }
  
  return {
    current: currentStepNumber,
    total: steps.length,
    percentage: steps.length > 0 ? Math.round((currentStepNumber / steps.length) * 100) : 0,
    currentId: currentStepId,
    isStep: steps.some(step => step.id === currentStepId)
  }
})

// Simple navigation actions (backend sync handled by useSurveyBackend hook)
export const nextStepAtom = atom(
  null,
  (get, set) => {
    const currentStepId = get(currentStepAtom)
    const stepSequence = getStepSequence()
    const reviewStepId = 13 // Review step is always step 13
    
    // Find current step in sequence
    const currentIndex = stepSequence.indexOf(currentStepId)
    
    if (currentIndex >= 0 && currentIndex < stepSequence.length - 1) {
      // Move to next step in sequence
      const nextStepId = stepSequence[currentIndex + 1]
      set(currentStepAtom, nextStepId)
    } else if (currentStepId < reviewStepId && currentIndex === -1) {
      // Current step not in sequence (might be 0), find the first step after it
      const nextStepId = stepSequence.find(id => id > currentStepId)
      if (nextStepId) {
        set(currentStepAtom, nextStepId)
      } else {
        // No steps after current, go to review
        set(currentStepAtom, reviewStepId)
      }
    } else if (currentIndex === stepSequence.length - 1) {
      // At the last step in sequence, go to review
      set(currentStepAtom, reviewStepId)
    } else {
      // Already at or past review step
      set(currentStepAtom, reviewStepId)
    }
    // Backend sync will be handled by components using useSurveyBackend hook
  }
)

export const previousStepAtom = atom(
  null,
  (get, set) => {
    const currentStepId = get(currentStepAtom)
    const stepSequence = getStepSequence()
    
    // Find current step in sequence
    const currentIndex = stepSequence.indexOf(currentStepId)
    
    if (currentIndex > 0) {
      // Move to previous step in sequence
      set(currentStepAtom, stepSequence[currentIndex - 1])
    } else if (currentStepId > 0) {
      // Go back to welcome step
      set(currentStepAtom, 0)
    }
  }
)

export const startSurveyAtom = atom(
  null,
  (get, set) => {
    const surveyData = get(surveyDataAtom)
    
    set(surveyDataAtom, {
      ...surveyData,
      startTime: new Date()
    })
    // Start with the first guide step (0.5)
    set(currentStepAtom, 0.5)
    // Backend sync will be handled by components using useSurveyBackend hook
  }
)

// Save minimal step data locally (full data goes to backend via useSurveyBackend)
export const saveStepDataAtom = atom(
  null,
  (get, set, stepId: number, data: StepData) => {
    const surveyData = get(surveyDataAtom)
    
    const completedSteps = surveyData.completedSteps.includes(stepId)
      ? surveyData.completedSteps
      : [...surveyData.completedSteps, stepId]
    
    set(surveyDataAtom, {
      ...surveyData,
      stepData: {
        ...surveyData.stepData,
        [stepId]: data
      },
      completedSteps
    })
  }
)

// Set syncing state for UI feedback
export const setSyncingAtom = atom(
  null,
  (get, set, syncing: boolean) => {
    const surveyData = get(surveyDataAtom)
    set(surveyDataAtom, {
      ...surveyData,
      currentlySyncing: syncing
    })
  }
)

// Simple validation for immediate UI feedback (detailed validation happens in backend)
export const validateStepDataAtom = atom(
  null,
  async (get, set, analysisResult: AnalysisResult | null): Promise<ValidationResult> => {
    if (!analysisResult) {
      return {
        passed: false,
        confidence: 0,
        message: 'Analysis failed - please try again'
      }
    }
    
    return {
      passed: analysisResult.isValid,
      confidence: analysisResult.confidence,
      message: analysisResult.message
      
    }
  }
) 