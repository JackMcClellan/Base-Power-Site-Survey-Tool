import { atom } from 'jotai'
import { SURVEY_STEPS, type SurveyStep } from '@/config/survey-steps'

// Basic analysis result interface for immediate UI feedback
interface AnalysisResult {
  overall: {
    passed: boolean
    confidence: number
    message: string
  }
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

// Survey steps configuration
export const surveyStepsAtom = atom<SurveyStep[]>(SURVEY_STEPS)

// Export types for components
export type { SurveyStep, AIConfig } from '@/config/survey-steps'
export type { StepData, ValidationResult, AnalysisResult }

// Derived atoms for UI state
export const currentStepDataAtom = atom((get) => {
  const currentStepId = get(currentStepAtom)
  const steps = get(surveyStepsAtom)
  
  // Map flow step IDs to camera step configuration:
  // Step 0: Welcome (no config needed)
  // Steps 1-5: Camera steps from configuration (map to steps[0] through steps[4])
  // Step 6+: Review (no config needed)
  
  if (currentStepId >= 1 && currentStepId <= steps.length) {
    return steps[currentStepId - 1]
  }
  
  return steps[0]
})

// Progress calculation for UI
export const surveyProgressAtom = atom((get) => {
  const currentStepId = get(currentStepAtom)
  const steps = get(surveyStepsAtom)
  
  let currentStepNumber = 0
  if (currentStepId >= 1 && currentStepId <= steps.length) {
    currentStepNumber = currentStepId
  } else if (currentStepId > steps.length) {
    currentStepNumber = steps.length
  }
  
  return {
    current: currentStepNumber,
    total: steps.length,
    percentage: steps.length > 0 ? Math.round((currentStepNumber / steps.length) * 100) : 0,
    currentId: currentStepId,
    isStep: currentStepId >= 1 && currentStepId <= steps.length
  }
})

// Simple navigation actions (backend sync handled by useSurveyBackend hook)
export const nextStepAtom = atom(
  null,
  (get, set) => {
    const currentStepId = get(currentStepAtom)
    const steps = get(surveyStepsAtom)
    const maxStepId = steps.length + 1 // +1 for review step
    
    if (currentStepId < maxStepId) {
      set(currentStepAtom, currentStepId + 1)
      // Backend sync will be handled by components using useSurveyBackend hook
    }
  }
)

export const previousStepAtom = atom(
  null,
  (get, set) => {
    const currentStepId = get(currentStepAtom)
    
    if (currentStepId > 0) {
      set(currentStepAtom, currentStepId - 1)
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
    set(currentStepAtom, 1)
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
      passed: analysisResult.overall.passed,
      confidence: analysisResult.overall.confidence,
      message: analysisResult.overall.message
    }
  }
) 