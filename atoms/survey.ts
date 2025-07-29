import { atom } from 'jotai'
import { MeterDetectionResult } from '@/lib/meter-detection'

// Survey step state
export const currentStepAtom = atom<number>(1)

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
  stepType: 'electricity_meter_closeup' | 'electricity_meter_wide' | 'electrical_panel' | 'installation_space' | 'other'
  
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

// Updated survey configuration for electricity meter steps
export const surveyStepsAtom = atom<{
  id: number
  title: string
  description: string
  type: 'dashboard' | 'camera' | 'review'
  stepType: 'electricity_meter_closeup' | 'electricity_meter_wide' | 'electrical_panel' | 'installation_space' | 'welcome' | 'review'
  instructions: string
  isStep: boolean // New field to indicate if this counts as a survey step
  validationChecks: {
    name: string
    description: string
    required: boolean
  }[]
  tips: string[]
}[]>([
  {
    id: 1,
    title: 'Welcome',
    description: 'Introduction to your electricity meter survey',
    type: 'dashboard',
    stepType: 'welcome',
    isStep: false, // Welcome is not a counted step
    instructions: 'Welcome to the Base Power Site Survey Tool. This survey will guide you through capturing important information about your electrical setup for battery system installation assessment.',
    validationChecks: [],
    tips: []
  },
  {
    id: 2,
    title: 'Electricity Meter Close-up',
    description: 'Capture a detailed photo of your electricity meter',
    type: 'camera',
    stepType: 'electricity_meter_closeup',
    isStep: true, // This is step 1 of the actual survey
    instructions: "Let's start with your electricity meter. Please get close enough so the numbers on it are clear and legible.",
    validationChecks: [
      {
        name: 'meter_identification',
        description: 'Does the image contain an identifiable electricity meter?',
        required: true
      },
      {
        name: 'visible_text_numbers',
        description: 'Are text and numbers on the meter face visible and clear?',
        required: true
      },
      {
        name: 'image_sharpness',
        description: 'Is the image sharp and not blurry?',
        required: true
      },
      {
        name: 'primary_subject',
        description: 'Is the meter the primary subject, filling a significant portion of the frame?',
        required: true
      }
    ],
    tips: [
      'Get within 2-3 feet of the meter',
      'Ensure good lighting on the meter face',
      'Hold your device steady to avoid blur',
      'Make sure the entire meter is visible in the frame'
    ]
  },
  {
    id: 3,
    title: 'Review',
    description: 'Review your survey results',
    type: 'review',
    stepType: 'review',
    isStep: false, // Review is not a counted step
    instructions: 'Review all captured data and photos from your survey.',
    validationChecks: [],
    tips: []
  }
])

// Derived atoms
export const currentStepDataAtom = atom((get) => {
  const currentStep = get(currentStepAtom)
  const steps = get(surveyStepsAtom)
  return steps.find(step => step.id === currentStep) || steps[0]
})

// Updated progress atom to only count actual survey steps
export const surveyProgressAtom = atom((get) => {
  const currentStep = get(currentStepAtom)
  const steps = get(surveyStepsAtom)
  const actualSteps = steps.filter(step => step.isStep)
  
  // Find current step info
  const currentStepInfo = steps.find(step => step.id === currentStep)
  const isCurrentStepCounted = currentStepInfo?.isStep || false
  
  // Calculate current step number among actual steps
  let currentStepNumber = 0
  if (isCurrentStepCounted) {
    const stepsBeforeCurrent = steps.filter(step => step.id < currentStep && step.isStep)
    currentStepNumber = stepsBeforeCurrent.length + 1
  }
  
  return {
    current: currentStepNumber, // Current step number (0 for welcome/review)
    total: actualSteps.length, // Total number of actual survey steps
    percentage: actualSteps.length > 0 ? Math.round((currentStepNumber / actualSteps.length) * 100) : 0,
    currentId: currentStep, // Keep track of the actual step ID for navigation
    isStep: isCurrentStepCounted // Whether current page is a counted step
  }
})

// Enhanced action atoms
export const nextStepAtom = atom(
  null,
  (get, set) => {
    const currentStep = get(currentStepAtom)
    const steps = get(surveyStepsAtom)
    const surveyData = get(surveyDataAtom)
    
    if (currentStep < steps.length) {
      set(currentStepAtom, currentStep + 1)
      
      // Only add to completedSteps if not already there (prevents duplicates when retaking photos)
      const completedSteps = surveyData.completedSteps.includes(currentStep) 
        ? surveyData.completedSteps 
        : [...surveyData.completedSteps, currentStep]
      
      set(surveyDataAtom, {
        ...surveyData,
        completedSteps
      })
    }
  }
)

export const previousStepAtom = atom(
  null,
  (get, set) => {
    const currentStep = get(currentStepAtom)
    if (currentStep > 1) {
      set(currentStepAtom, currentStep - 1)
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
    set(surveyDataAtom, {
      ...surveyData,
      stepData: {
        ...surveyData.stepData,
        [stepId]: data
      }
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
      
      const currentStep = get(surveyStepsAtom).find(s => s.id === stepId)
      if (currentStep) {
        currentStep.validationChecks.forEach(check => {
          fallbackValidation.checks[check.name] = {
            passed: false,
            confidence: 0,
            message: 'Analysis failed'
          }
        })
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