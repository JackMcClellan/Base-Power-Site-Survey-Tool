import { atom } from 'jotai'
import { MeterDetectionResult } from '@/lib/meter-detection'
import { SURVEY_STEPS, type SurveyStep } from '@/config/survey-steps'

// Survey step state - starts at 0 for welcome page
export const currentStepAtom = atom<number>(0)

// Enhanced validation result interface
interface ValidationResult {
  passed: boolean
  confidence: number // 0-1 score
  message: string
  details?: Record<string, unknown>
}

// Enhanced image metadata
interface ImageMetadata {
  width: number
  height: number
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  sharpness: number // 0-1 score
  brightness: number // 0-1 score
  timestamp: Date
  deviceInfo?: {
    userAgent: string
    screenResolution: string
  }
}

// Detection data for AI validation
interface DetectionData {
  objectType: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number
  features: {
    hasVisibleText: boolean
    hasNumbers: boolean
    isCircular: boolean
    isRectangular: boolean
    hasGlassCover: boolean
    hasDigitalDisplay: boolean
    hasDials: boolean
  }
  frameOccupancy: number // Percentage of frame occupied by object
}

// Environmental context for wide shots
interface EnvironmentalContext {
  wallVisible: boolean
  groundVisible: boolean
  obstructions: {
    windows: number
    doors: number
    utilityBoxes: number
    other: string[]
  }
  clearanceArea: {
    left: number
    right: number
    above: number
    below: number
  }
}

// Enhanced survey step data interface
interface SurveyStepData {
  timestamp: Date
  action: 'capture' | 'skip' | 'manual' | 'retry'
  stepTitle: string
  
  // Image and capture data
  imageMetadata?: ImageMetadata
  imageData?: string // base64 encoded image
  
  // AI validation results
  validationResults: {
    overall: ValidationResult
    checks: {
      [checkName: string]: ValidationResult
    }
  }
  
  // Detection and analysis data
  detectionData?: DetectionData
  environmentalContext?: EnvironmentalContext
  
  // Additional step-specific data
  data?: {
    detectionType?: string
    meterType?: 'analog' | 'digital' | 'smart' | 'unknown'
    readingValue?: string
    modelNumber?: string
    manufacturer?: string
    installationYear?: string
    [key: string]: string | number | boolean | undefined
  }
  
  // Quality assurance
  qualityScore: number // Overall quality score 0-1
  requiresReview: boolean
  retryCount: number
}

// Survey data collection with enhanced structure
export const surveyDataAtom = atom<{
  stepData: Record<number, SurveyStepData>
  images: { 
    stepId: number
    imageData: string
    timestamp: Date
    metadata: ImageMetadata
  }[]
  startTime: Date | null
  completedSteps: number[]
  surveyContext: {
    location?: {
      address?: string
      coordinates?: { lat: number, lng: number }
    }
    property?: {
      type: 'residential' | 'commercial' | 'industrial'
      constructionYear?: number
      electricalSystemAge?: string
    }
    weather?: {
      condition: string
      lighting: 'excellent' | 'good' | 'fair' | 'poor'
    }
  }
}>({
  stepData: {},
  images: [],
  startTime: null,
  completedSteps: [],
  surveyContext: {}
})

// Use the JSON-like step configuration
export const surveyStepsAtom = atom<SurveyStep[]>(SURVEY_STEPS)

// Export types for use in components
export type { SurveyStep, OverlayDefinition, AIConfig } from '@/config/survey-steps'
export type { SurveyStepData, ValidationResult }

// Derived atoms
export const currentStepDataAtom = atom((get) => {
  const currentStepId = get(currentStepAtom)
  const steps = get(surveyStepsAtom)
  
  // Map flow step IDs to camera step configuration:
  // Step 0: Welcome (no config needed)
  // Steps 1-5: Camera steps from configuration (map to steps[0] through steps[4])
  // Step 6+: Review (no config needed)
  
  if (currentStepId >= 1 && currentStepId <= steps.length) {
    // Map flow step ID to camera step configuration (1-based to 0-based)
    return steps[currentStepId - 1]
  }
  
  // Fallback to first step for welcome/review/invalid states
  return steps[0]
})

// Updated progress atom to only count camera steps
export const surveyProgressAtom = atom((get) => {
  const currentStepId = get(currentStepAtom)
  const steps = get(surveyStepsAtom)
  
  // Only camera steps (1-5) count toward progress
  // Step 0 (welcome) and step 6+ (review) don't count
  
  let currentStepNumber = 0
  if (currentStepId >= 1 && currentStepId <= steps.length) {
    currentStepNumber = currentStepId // Step 1 = progress 1, step 2 = progress 2, etc.
  } else if (currentStepId > steps.length) {
    currentStepNumber = steps.length // Review shows as completed
  }
  
  return {
    current: currentStepNumber, // Current camera step number (0 for welcome, steps.length for review)
    total: steps.length, // Total number of camera steps
    percentage: steps.length > 0 ? Math.round((currentStepNumber / steps.length) * 100) : 0,
    currentId: currentStepId, // Keep track of the actual flow step ID
    isStep: currentStepId >= 1 && currentStepId <= steps.length // Whether current is a counted camera step
  }
})

// Enhanced action atoms
export const nextStepAtom = atom(
  null,
  (get, set) => {
    const currentStepId = get(currentStepAtom)
    const steps = get(surveyStepsAtom)
    const surveyData = get(surveyDataAtom)
    
    // Flow: Welcome(0) -> Camera Steps(1-5) -> Review(6)
    const maxStepId = steps.length + 1 // +1 for review step
    
    if (currentStepId < maxStepId) {
      const nextId = currentStepId + 1
      set(currentStepAtom, nextId)
    }
  }
)

export const previousStepAtom = atom(
  null,
  (get, set) => {
    const currentStepId = get(currentStepAtom)
    
    // Can go back as long as we're not at the welcome step (0)
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
  }
)

export const saveSurveyDataAtom = atom(
  null,
  (get, set, stepId: number, data: SurveyStepData) => {
    const surveyData = get(surveyDataAtom)
    
    // Ensure the step is marked as completed when data is saved
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

// Real validation atom using vision system
export const validateStepDataAtom = atom(
  null,
  async (get, set, stepId: number, detectionResult: MeterDetectionResult | null, stepType: string) => {
    // detectionResult should be a MeterDetectionResult from the vision system
    // Transform the detection result to match the survey validation structure
    
    if (!detectionResult || !detectionResult.checks) {
      // Fallback for invalid detection results
      const fallbackValidation: SurveyStepData['validationResults'] = {
        overall: {
          passed: false,
          confidence: 0,
          message: 'Vision analysis failed - please try again',
        },
        checks: {}
      }
      
      return fallbackValidation
    }
    
    // Transform MeterDetectionResult to SurveyStepData validation format
    const visionValidation: SurveyStepData['validationResults'] = {
      overall: detectionResult.overall,
      checks: detectionResult.checks
    }
    
    return visionValidation
  }
) 