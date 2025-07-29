import { ImageQualityMetrics } from './vision-utils'

// Validation result interface for individual checks
export interface MeterDetectionResult {
  overall: {
    passed: boolean
    confidence: number // 0-1 score
    message: string
  }
  checks: {
    [checkName: string]: {
      passed: boolean
      confidence: number
      message: string
    }
  }
  detectionData: {
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
  imageQuality: ImageQualityMetrics
  qualityScore: number // Overall quality score 0-1
}

// Real-time feedback interface for live guidance
export interface RealTimeFeedback {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  confidence: number
  suggestions: string[]
} 