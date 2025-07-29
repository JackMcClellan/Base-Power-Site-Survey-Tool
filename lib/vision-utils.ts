// Image quality analysis result
export interface ImageQualityMetrics {
  sharpness: number // 0-1 score
  brightness: number // 0-1 score  
  contrast: number // 0-1 score
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor'
  qualityScore: number // 0-1 composite score
}

// Object detection result
export interface DetectionResult {
  objectType: 'electricity_meter' | 'unknown'
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence: number // 0-1
  frameOccupancy: number // Percentage of frame occupied by object
}

// Image capture result  
export interface CaptureResult {
  canvas: HTMLCanvasElement
  imageData: string // base64 data URL
  timestamp: Date
} 