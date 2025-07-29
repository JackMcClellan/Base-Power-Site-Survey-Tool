import {
  captureImageFromVideo,
  analyzeImageQuality,
  detectRectangularObject,
  analyzeTextVisibility,
  ImageQualityMetrics,
  DetectionResult
} from './vision-utils'

// Meter detection result interface matching the survey data structure
export interface MeterDetectionResult {
  overall: {
    passed: boolean
    confidence: number
    message: string
  }
  checks: {
    meter_identification: {
      passed: boolean
      confidence: number
      message: string
    }
    visible_text_numbers: {
      passed: boolean
      confidence: number
      message: string
    }
    image_sharpness: {
      passed: boolean
      confidence: number
      message: string
    }
    primary_subject: {
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
    frameOccupancy: number
  }
  imageQuality: ImageQualityMetrics
  qualityScore: number
}

// Specific thresholds for electricity meter detection - adjusted for real-world performance
const METER_DETECTION_THRESHOLDS = {
  minConfidence: 0.3,        // Lowered for real-world meter detection
  minFrameOccupancy: 0.08,   // Reduced to allow more flexible framing
  maxFrameOccupancy: 0.9,    // Increased to allow closer shots
  minSharpness: 0.15,        // Lowered for mobile camera limitations
  minTextConfidence: 0.25,   // Reduced for varied lighting conditions
  minOverallQuality: 0.25    // Lowered for practical use
}

// Analyze meter characteristics to determine if it's circular or rectangular
function analyzeMeterShape(detectionResult: DetectionResult): {
  isCircular: boolean
  isRectangular: boolean
  shapeConfidence: number
} {
  const { boundingBox } = detectionResult
  const aspectRatio = boundingBox.width / boundingBox.height
  
  // Circular meters tend to have aspect ratios close to 1.0
  // Rectangular meters have aspect ratios further from 1.0
  const circularScore = 1 - Math.abs(aspectRatio - 1.0)
  const rectangularScore = Math.abs(aspectRatio - 1.0) * 2 // Favor non-square rectangles
  
  const isCircular = circularScore > 0.7 && detectionResult.confidence > 0.5
  const isRectangular = rectangularScore > 0.4 && detectionResult.confidence > 0.5
  
  return {
    isCircular,
    isRectangular,
    shapeConfidence: Math.max(circularScore, rectangularScore)
  }
}

// Main electricity meter detection function
export async function detectElectricityMeter(videoElement: HTMLVideoElement): Promise<MeterDetectionResult> {
  try {
    // Capture image from video stream
    const { canvas, imageData } = captureImageFromVideo(videoElement)
    
    // Run parallel analysis
    const [qualityMetrics, objectDetection, textAnalysis] = await Promise.all([
      analyzeImageQuality(canvas),
      detectRectangularObject(canvas),
      analyzeTextVisibility(canvas)
    ])
    
    // Analyze meter shape characteristics
    const shapeAnalysis = analyzeMeterShape(objectDetection)
    
    // Check 1: Meter Identification
    const hasIdentifiableMeter = objectDetection.hasObject && 
                                objectDetection.confidence >= METER_DETECTION_THRESHOLDS.minConfidence
    
    const meterIdentificationCheck = {
      passed: hasIdentifiableMeter,
      confidence: objectDetection.confidence,
      message: hasIdentifiableMeter 
        ? `Electricity meter detected with ${Math.round(objectDetection.confidence * 100)}% confidence`
        : objectDetection.hasObject 
          ? `Object detected but may not be a meter. Point camera directly at the electricity meter with dials or digital display.`
          : 'No electricity meter found. Please point camera at your home\'s electricity meter (usually a round or square device with numbers).'
    }
    
    // Check 2: Visible Text and Numbers
    const hasRequiredText = textAnalysis.hasVisibleText && 
                           textAnalysis.textConfidence >= METER_DETECTION_THRESHOLDS.minTextConfidence &&
                           textAnalysis.hasNumbers
    
    const visibleTextNumbersCheck = {
      passed: hasRequiredText,
      confidence: Math.min(textAnalysis.textConfidence, textAnalysis.numbersConfidence),
      message: hasRequiredText
        ? `Text and numbers clearly visible (${Math.round(textAnalysis.textConfidence * 100)}% confidence)`
        : textAnalysis.hasVisibleText
          ? textAnalysis.hasNumbers 
            ? 'Numbers are visible but not clear enough. Move closer or improve lighting.'
            : 'Text detected but meter readings not visible. Ensure you can see numbers on the meter face.'
          : 'Cannot see meter readings. Get closer and ensure the meter face with numbers is clearly visible.'
    }
    
    // Check 3: Image Sharpness
    const isSharpEnough = qualityMetrics.sharpness >= METER_DETECTION_THRESHOLDS.minSharpness
    
    const imageSharpnessCheck = {
      passed: isSharpEnough,
      confidence: qualityMetrics.sharpness,
      message: isSharpEnough
        ? `Image is sharp and clear (${Math.round(qualityMetrics.sharpness * 100)}% sharpness)`
        : qualityMetrics.sharpness > 0.1
          ? 'Image is slightly blurry. Hold your device steady, tap to focus, and try again.'
          : 'Image is too blurry to read meter numbers. Hold device steady, ensure good lighting, and tap to focus.'
    }
    
    // Check 4: Primary Subject (Frame Occupancy)
    const frameOccupancy = objectDetection.frameOccupancy
    const isGoodFraming = frameOccupancy >= METER_DETECTION_THRESHOLDS.minFrameOccupancy &&
                         frameOccupancy <= METER_DETECTION_THRESHOLDS.maxFrameOccupancy
    
    const primarySubjectCheck = {
      passed: isGoodFraming,
      confidence: frameOccupancy > METER_DETECTION_THRESHOLDS.maxFrameOccupancy 
        ? (1 - frameOccupancy) * 2  // Penalty for being too close
        : Math.min(frameOccupancy / METER_DETECTION_THRESHOLDS.minFrameOccupancy, 1), // Reward for good framing
      message: frameOccupancy < METER_DETECTION_THRESHOLDS.minFrameOccupancy
        ? `Move closer to the meter. The meter should fill more of your camera frame so numbers are clearly readable.`
        : frameOccupancy > METER_DETECTION_THRESHOLDS.maxFrameOccupancy
          ? `Too close to meter. Step back so you can see the entire meter face and surrounding area.`
          : `Perfect framing - meter occupies ${Math.round(frameOccupancy * 100)}% of frame`
    }
    
    // Calculate overall result
    const checks = {
      meter_identification: meterIdentificationCheck,
      visible_text_numbers: visibleTextNumbersCheck,
      image_sharpness: imageSharpnessCheck,
      primary_subject: primarySubjectCheck
    }
    
    const allRequiredChecksPassed = Object.values(checks).every(check => check.passed)
    const averageConfidence = Object.values(checks).reduce((sum, check) => sum + check.confidence, 0) / 4
    
    const overall = {
      passed: allRequiredChecksPassed,
      confidence: averageConfidence,
      message: allRequiredChecksPassed
        ? 'All validation checks passed - excellent meter capture!'
        : `${Object.values(checks).filter(c => !c.passed).length} validation check(s) failed`
    }
    
    // Build detection data
    const detectionData = {
      objectType: 'electricity_meter',
      boundingBox: objectDetection.boundingBox,
      confidence: objectDetection.confidence,
      features: {
        hasVisibleText: textAnalysis.hasVisibleText,
        hasNumbers: textAnalysis.hasNumbers,
        isCircular: shapeAnalysis.isCircular,
        isRectangular: shapeAnalysis.isRectangular,
        hasGlassCover: true, // Assume true for now - would need more sophisticated detection
        hasDigitalDisplay: textAnalysis.hasNumbers && !shapeAnalysis.isCircular, // Heuristic
        hasDials: shapeAnalysis.isCircular && textAnalysis.hasNumbers // Heuristic
      },
      frameOccupancy: objectDetection.frameOccupancy
    }
    
    // Calculate overall quality score
    const qualityScore = (
      qualityMetrics.qualityScore * 0.3 +
      objectDetection.confidence * 0.3 +
      averageConfidence * 0.4
    )
    
    return {
      overall,
      checks,
      detectionData,
      imageQuality: qualityMetrics,
      qualityScore
    }
    
  } catch (error) {
    console.error('Error in meter detection:', error)
    
    // Return error result
    const errorResult: MeterDetectionResult = {
      overall: {
        passed: false,
        confidence: 0,
        message: `Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      checks: {
        meter_identification: { passed: false, confidence: 0, message: 'Detection failed' },
        visible_text_numbers: { passed: false, confidence: 0, message: 'Detection failed' },
        image_sharpness: { passed: false, confidence: 0, message: 'Detection failed' },
        primary_subject: { passed: false, confidence: 0, message: 'Detection failed' }
      },
      detectionData: {
        objectType: 'unknown',
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        confidence: 0,
        features: {
          hasVisibleText: false,
          hasNumbers: false,
          isCircular: false,
          isRectangular: false,
          hasGlassCover: false,
          hasDigitalDisplay: false,
          hasDials: false
        },
        frameOccupancy: 0
      },
      imageQuality: {
        sharpness: 0,
        brightness: 0,
        contrast: 0,
        overallQuality: 'poor',
        qualityScore: 0
      },
      qualityScore: 0
    }
    
    return errorResult
  }
}

// Real-time feedback for guiding user positioning
export interface RealTimeFeedback {
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  confidence: number
  suggestions: string[]
}

// Provide real-time feedback during camera preview
export async function getRealTimeFeedback(videoElement: HTMLVideoElement): Promise<RealTimeFeedback> {
  try {
    const { canvas } = captureImageFromVideo(videoElement)
    const [qualityMetrics, objectDetection, textAnalysis] = await Promise.all([
      analyzeImageQuality(canvas),
      detectRectangularObject(canvas),
      analyzeTextVisibility(canvas)
    ])
    
    const suggestions: string[] = []
    let message = ''
    let type: 'success' | 'warning' | 'error' | 'info' = 'info'
    
    // Priority-based feedback system for better user guidance
    
    // 1. Check if we can see any object at all
    if (!objectDetection.hasObject) {
      message = 'Point camera at your electricity meter'
      type = 'info'
      suggestions.push('Look for a round or square device with numbers')
      suggestions.push('Usually mounted on exterior wall or in utility room')
    } 
    // 2. Check object confidence (is it likely a meter?)
    else if (objectDetection.confidence < METER_DETECTION_THRESHOLDS.minConfidence) {
      message = 'Make sure this is your electricity meter'
      type = 'warning'
      suggestions.push('Look for a device with dials or digital display')
      suggestions.push('Should have kilowatt hour (kWh) readings')
    } 
    // 3. Check framing - is the meter appropriately sized?
    else if (objectDetection.frameOccupancy < METER_DETECTION_THRESHOLDS.minFrameOccupancy) {
      message = 'Move closer - meter numbers need to be readable'
      type = 'warning'
      suggestions.push('Get within 2-3 feet of the meter')
      suggestions.push('Fill about 20-40% of your camera frame')
    } 
    else if (objectDetection.frameOccupancy > METER_DETECTION_THRESHOLDS.maxFrameOccupancy) {
      message = 'Step back to show the full meter'
      type = 'warning'
      suggestions.push('Include some space around the meter')
      suggestions.push('Make sure entire meter face is visible')
    } 
    // 4. Check if text/numbers are visible
    else if (!textAnalysis.hasVisibleText || !textAnalysis.hasNumbers) {
      message = 'Cannot see meter readings clearly'
      type = 'warning'
      suggestions.push('Ensure meter face is well-lit')
      suggestions.push('Look for numbers showing your usage')
    }
    // 5. Check image sharpness
    else if (qualityMetrics.sharpness < METER_DETECTION_THRESHOLDS.minSharpness) {
      message = 'Hold steady - image is blurry'
      type = 'warning'
      suggestions.push('Keep camera still while focusing')
      suggestions.push('Tap screen to focus on meter')
    }
    // 6. Check overall brightness
    else if (qualityMetrics.brightness < 0.3) {
      message = 'More light needed'
      type = 'warning'
      suggestions.push('Use flashlight or move to better lighting')
      suggestions.push('Avoid shadows on meter face')
    }
    else if (qualityMetrics.brightness > 0.8) {
      message = 'Too bright - avoid direct sunlight'
      type = 'warning'
      suggestions.push('Move slightly to reduce glare')
      suggestions.push('Try a different angle')
    }
    // 7. All good!
    else {
      message = 'Perfect! Ready to capture meter'
      type = 'success'
      suggestions.push('Tap the capture button')
      suggestions.push('Hold steady while capturing')
    }
    
    return {
      message,
      type,
      confidence: objectDetection.confidence,
      suggestions
    }
    
  } catch (error) {
    return {
      message: 'Camera analysis in progress...',
      type: 'info',
      confidence: 0,
      suggestions: ['Please wait while camera initializes']
    }
  }
} 