'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { CameraView } from '@/components/camera-view'
import { SurveyHeader } from '@/components/shared/survey-header'
import { SurveyInstructions } from '@/components/shared/survey-instructions'
import { SurveyActions } from '@/components/shared/survey-actions'
import { Button } from '@/components/ui/button'

import { 
  createMeterGuidingFrame, 
  createDetectionHighlight, 
  createRealTimeFeedbackOverlay,
  createScanningOverlay,
  createQualityIndicator,
  createMeterTypeIndicator
} from '@/lib/vision-overlays'

import { useCamera } from '@/hooks/use-camera'

import { MeterDetectionResult } from '@/lib/meter-detection'

import { 
  currentStepDataAtom, 
  surveyProgressAtom, 
  nextStepAtom, 
  saveSurveyDataAtom,
  validateStepDataAtom
} from '@/atoms/survey'



export function Step2ElectricityMeterCloseup() {
  const currentStep = useAtomValue(currentStepDataAtom)
  const progress = useAtomValue(surveyProgressAtom)
  const nextStep = useSetAtom(nextStepAtom)
  const saveSurveyData = useSetAtom(saveSurveyDataAtom)
  const validateStepData = useSetAtom(validateStepDataAtom)
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzingCapture, setIsAnalyzingCapture] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<MeterDetectionResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showResults, setShowResults] = useState(false)

  // Use basic camera hook (no vision requirements for capture)
  const { cameraStream, cameraStatus, isCameraAvailable, requestCameraAccess } = useCamera()
  
  // Backend API will handle image analysis after capture

  // Simple guiding overlay - no real-time analysis
  const overlays = useMemo(() => [
    createMeterGuidingFrame('rgba(208, 245, 133, 0.8)', 3), // Primary color (light green) guiding frame
  ], [])

  // Video element ref for basic capture
  const videoRef = useRef<HTMLVideoElement>(null)

  // Debug camera state changes
  useEffect(() => {
    console.log('Camera state update:', {
      cameraStatus,
      isCameraAvailable,
      hasStream: !!cameraStream,
      hasVideoRef: !!videoRef.current,
      videoReady: videoRef.current ? videoRef.current.readyState >= 2 : false
    })
  }, [cameraStatus, isCameraAvailable, cameraStream, videoRef.current])

  const handleCapture = useCallback(async () => {
    console.log('Capturing electricity meter image')
    console.log('Camera status:', { isCameraAvailable, hasVideoRef: !!videoRef.current, cameraStatus })
    
    // Get video element - either from ref or find it in DOM
    let videoElement = videoRef.current
    if (!videoElement) {
      // Fallback: find the video element in the CameraView
      const videoElements = document.querySelectorAll('video')
      videoElement = videoElements[0] as HTMLVideoElement
    }
    
    if (!videoElement) {
      console.error('No video element found')
      return
    }
    
    if (!cameraStream) {
      console.error('Camera stream not available')
      return
    }
    
    try {
      // Step 1: Capture image immediately using basic capture method
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }
      
      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64 data URL
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      // Show captured image to user immediately
      setCapturedImage(imageData)
      setShowResults(true)
      
      // Step 2: Start background analysis using backend API
      setIsAnalyzingCapture(true)
      
      // Send image to backend for analysis
      setTimeout(async () => {
        try {
          // Convert image data to blob for API upload
          const response = await fetch(imageData)
          const blob = await response.blob()
          
          // Create form data for API upload
          const formData = new FormData()
          formData.append('image', blob, 'meter-image.jpg')
          formData.append('step', 'electricity-meter')
          formData.append('timestamp', new Date().toISOString())
          
          // Call backend API for analysis
          const analysisResponse = await fetch('/api/analyze-meter', {
            method: 'POST',
            body: formData,
          })
          
          if (!analysisResponse.ok) {
            throw new Error(`Analysis API failed: ${analysisResponse.status}`)
          }
          
          const analysisResult = await analysisResponse.json()
          
          // Validate the results using existing validation logic
          const validation = await validateStepData(currentStep.id, analysisResult, 'electricity_meter_closeup')
          
          // Store results
          setAnalysisResult(analysisResult)
          setIsAnalyzingCapture(false)
          
          console.log('Backend analysis result:', analysisResult)
          
        } catch (error) {
          console.error('Backend analysis failed:', error)
          setIsAnalyzingCapture(false)
          
          // Create fallback result
          setAnalysisResult({
            overall: { passed: false, confidence: 0, message: 'Backend analysis failed - please try again' },
            checks: {
              meter_identification: { passed: false, confidence: 0, message: 'Could not analyze image' },
              visible_text_numbers: { passed: false, confidence: 0, message: 'Could not analyze image' },
              image_sharpness: { passed: false, confidence: 0, message: 'Could not analyze image' },
              primary_subject: { passed: false, confidence: 0, message: 'Could not analyze image' }
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
          })
        }
      }, 500) // Shorter delay since we're using backend
      
    } catch (error) {
      console.error('Capture failed:', error)
    }
  }, [isCameraAvailable, cameraStream, cameraStatus, validateStepData, currentStep.id])

  // Separate function to handle successful capture or manual override
  const proceedWithCapture = useCallback((detectionResult: MeterDetectionResult, validation: { overall: { passed: boolean; confidence: number; message: string }; checks: Record<string, { passed: boolean; confidence: number; message: string }> }, timestamp: Date, imageData: string) => {
    try {
      // Create step data with real vision analysis results
      const stepData = {
        timestamp,
        action: 'capture' as const,
        stepTitle: currentStep.title,
        stepType: 'electricity_meter_closeup' as const,
        imageData,
        imageMetadata: {
          width: 1920, // These would come from the actual capture
          height: 1080,
          quality: detectionResult.imageQuality.overallQuality,
          sharpness: detectionResult.imageQuality.sharpness,
          brightness: detectionResult.imageQuality.brightness,
          timestamp,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`
          }
        },
        validationResults: validation,
        detectionData: detectionResult.detectionData,
        data: {
          detectionType: 'electricity_meter',
          meterType: detectionResult.detectionData.features.hasDigitalDisplay ? 'digital' as const : 'analog' as const,
          readingValue: 'Detected', // Would extract from OCR in full implementation
          manufacturer: 'Unknown' // Would detect from image analysis
        },
        qualityScore: detectionResult.qualityScore,
        requiresReview: !validation.overall.passed,
        retryCount: 0
      }

      saveSurveyData(currentStep.id, stepData)
      
      // Always advance to next step when we reach this point
      setTimeout(() => {
        nextStep()
      }, 500)
      
    } catch (error) {
      console.error('Failed to save capture data:', error)
    }
  }, [currentStep.id, saveSurveyData, nextStep])

  // Handle proceeding to next step after successful analysis
  const handleProceed = useCallback(() => {
    if (!capturedImage || !analysisResult) return
    
    const currentTime = new Date()
    const validation = {
      overall: { passed: true, confidence: analysisResult.overall.confidence, message: analysisResult.overall.message },
      checks: analysisResult.checks
    }
    
    proceedWithCapture(analysisResult, validation, currentTime, capturedImage)
  }, [capturedImage, analysisResult, proceedWithCapture])

  // Handle retaking the photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setAnalysisResult(null)
    setShowResults(false)
    setIsAnalyzingCapture(false)
    setRetryCount(prev => prev + 1)
  }, [])

  // Handle manual override - proceed despite validation failure
  const handleManualOverride = useCallback(() => {
    if (!capturedImage || !analysisResult) return
    
    const currentTime = new Date()
    
    // Create validation result that indicates manual override
    const overrideValidation = {
      overall: { passed: true, confidence: 0, message: 'Manual override - proceeding for human review' },
      checks: analysisResult.checks
    }
    
    proceedWithCapture(analysisResult, overrideValidation, currentTime, capturedImage)
  }, [capturedImage, analysisResult, proceedWithCapture])

  const handleSkip = useCallback(() => {
    const stepData = {
      timestamp: new Date(),
      action: 'skip' as const,
      stepTitle: currentStep.title,
      stepType: 'electricity_meter_closeup' as const,
      validationResults: {
        overall: { passed: false, confidence: 0, message: 'Skipped by user' },
        checks: {}
      },
      qualityScore: 0,
      requiresReview: true,
      retryCount: retryCount
    }
    
    saveSurveyData(currentStep.id, stepData)
    nextStep()
  }, [currentStep.id, currentStep.title, saveSurveyData, nextStep, retryCount])





  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <SurveyHeader />
      
      {/* Camera View */}
      <div className="relative flex-1 overflow-hidden">
        <CameraView 
          overlays={overlays} 
          onCameraReady={(video) => {
            videoRef.current = video
          }}
        />
        
        {/* Captured Image Display */}
        {capturedImage && showResults && (
          <div className="absolute inset-0 z-40 bg-background">
            <img 
              src={capturedImage} 
              alt="Captured meter" 
              className="w-full h-full object-contain"
            />
            
            {/* Analysis Status Overlay */}
            <div className="absolute top-4 left-4 right-4">
              {isAnalyzingCapture ? (
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                  <span>Analyzing image...</span>
                </div>
              ) : analysisResult ? (
                <div className="space-y-3">
                  {analysisResult.overall.passed ? (
                    <div className="bg-primary-foreground text-secondary-foreground px-4 py-2 rounded-lg">
                      Validation Passed - Great photo!
                    </div>
                  ) : (
                    <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg">
                      <div className="font-medium mb-2">Issues Found:</div>
                      <div className="text-sm space-y-1">
                        {Object.entries(analysisResult.checks)
                          .filter(([_, check]) => !check.passed)
                          .map(([key, check]) => (
                            <div key={key}>• {check.message}</div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Action Buttons */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  Retake Photo
                </Button>
                
                {!isAnalyzingCapture && analysisResult && (
                  <>
                    {analysisResult.overall.passed ? (
                      <Button
                        onClick={handleProceed}
                        variant="default"
                        size="lg"
                        className="flex-1"
                      >
                        Continue
                      </Button>
                    ) : (
                      retryCount >= 2 && (
                        <Button
                          onClick={handleManualOverride}
                          variant="destructive"
                          size="lg"
                          className="flex-1"
                        >
                          Use Anyway
                        </Button>
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {false && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-foreground">Analyzing electricity meter...</p>
            </div>
          </div>
        )}
        
        {/* Bottom UI Container */}
        <div 
          className="absolute bottom-0 inset-x-0 z-30"
          style={{ paddingBottom: `env(safe-area-inset-bottom)` }}
        >
          <SurveyInstructions 
            instructions={currentStep.instructions}
            tips={currentStep.tips}
          />
          <SurveyActions 
            onCapture={handleCapture}
            onSkip={handleSkip}
            isLastStep={progress.current === progress.total}
            isLoading={!cameraStream || showResults}
            captureLabel={
              !cameraStream ? "Starting Camera..." :
              showResults ? "Photo Captured" :
              "Take Picture"
            }
          />
        </div>
      </div>
    </div>
  )
} 