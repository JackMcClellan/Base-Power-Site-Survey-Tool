'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { CameraView } from '@/components/camera-view'
import { SurveyHeader } from '@/components/shared/survey-header'
import { SurveyInstructions } from '@/components/shared/survey-instructions'
import { SurveyActions } from '@/components/shared/survey-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Overlays removed - clean camera view only

import { useCamera } from '@/hooks/use-camera'

// Simple result interface
interface AnalysisResult {
  overall: {
    passed: boolean
    confidence: number
    message: string
  }
  extractedValue?: string  // For data extraction steps
}

import { 
  currentStepDataAtom, 
  surveyProgressAtom, 
  nextStepAtom, 
  saveSurveyDataAtom,
  surveyDataAtom
} from '@/atoms/survey'



export function CameraStep() {
  const currentStep = useAtomValue(currentStepDataAtom)
  const progress = useAtomValue(surveyProgressAtom)
  const surveyData = useAtomValue(surveyDataAtom)
  const nextStep = useSetAtom(nextStepAtom)
  const saveSurveyData = useSetAtom(saveSurveyDataAtom)
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzingCapture, setIsAnalyzingCapture] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [dataEntryValue, setDataEntryValue] = useState<string>('')
  const [isLoadingRelatedImage, setIsLoadingRelatedImage] = useState(false)

  // Use basic camera hook (no vision requirements for capture)
  const { cameraStream, cameraStatus, isCameraAvailable } = useCamera()
  
  // Check if this is a data entry step
  const isDataEntryStep = currentStep.stepType === 'data-entry'
  
  // Get related step image for data entry steps
  const relatedStepImage = useMemo(() => {
    if (isDataEntryStep && currentStep.dataEntryConfig?.relatedStepId) {
      const relatedData = surveyData.stepData[currentStep.dataEntryConfig.relatedStepId]
      return relatedData?.imageData || null
    }
    return null
  }, [isDataEntryStep, currentStep.dataEntryConfig, surveyData])
  
  // Backend API will handle image analysis after capture

  // Overlays removed - camera now has clean view without any AR elements

  // Video element ref for basic capture
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Monitor camera state changes  
  useEffect(() => {
    // Camera state is tracked but not logged in production
  }, [cameraStatus, isCameraAvailable, cameraStream, currentStep.id])

  // Reset capture state when step changes
  useEffect(() => {
    // Always reset all state when step changes
    setCapturedImage(null)
    setAnalysisResult(null)
    setIsAnalyzingCapture(false)
    setRetryCount(0) // Reset retry count for new step
    setDataEntryValue('') // Reset data entry value
    setIsLoadingRelatedImage(false)
    
    // Clear video ref to force fresh capture
    if (videoRef.current) {
      // Force video element to refresh
      const currentVideo = videoRef.current
      if (currentVideo.srcObject) {
        // Temporarily pause to force refresh
        currentVideo.pause()
        setTimeout(() => {
          if (currentVideo.srcObject) {
            currentVideo.play().catch(() => {
              // Ignore play errors in production
            })
          }
        }, 100)
      }
    }
    videoRef.current = null
    
    // Force re-render by clearing any cached state
    return () => {
      setCapturedImage(null)
      setAnalysisResult(null)
      videoRef.current = null
    }
  }, [currentStep.id])

  // For data entry steps, analyze the related image automatically
  useEffect(() => {
    if (isDataEntryStep && relatedStepImage && !analysisResult) {
      analyzeRelatedImage()
    }
  }, [isDataEntryStep, relatedStepImage, currentStep.id])

  const analyzeRelatedImage = useCallback(async () => {
    if (!relatedStepImage) return
    
    setIsAnalyzingCapture(true)
    setIsLoadingRelatedImage(true)
    
    try {
      // Convert data URL to blob
      const response = await fetch(relatedStepImage)
      const blob = await response.blob()
      
      // Create form data for API upload
      const formData = new FormData()
      formData.append('image', blob, 'related-image.jpg')
      formData.append('step', `data-entry-${currentStep.id}`)
      formData.append('timestamp', new Date().toISOString())
      formData.append('isDataExtraction', 'true')
      
      // Add AI configuration
      if (currentStep.aiConfig) {
        formData.append('userPrompt', currentStep.aiConfig.userPrompt)
      }
      
      // Call backend API for analysis
      const analysisResponse = await fetch('/api/analyze-meter', {
        method: 'POST',
        body: formData,
      })
      
      if (!analysisResponse.ok) {
        throw new Error(`Analysis API failed: ${analysisResponse.status}`)
      }
      
      const result = await analysisResponse.json()
      
      // Store results
      setAnalysisResult(result)
      setIsAnalyzingCapture(false)
      setIsLoadingRelatedImage(false)
      
      // If we got an extracted value, set it in the input (strip the 'A' suffix)
      if (result.extractedValue) {
        const numericValue = result.extractedValue.replace(/[^0-9]/g, '')
        setDataEntryValue(numericValue)
      }
      
    } catch (error) {
      console.error('Data extraction failed:', error)
      setIsAnalyzingCapture(false)
      setIsLoadingRelatedImage(false)
      
      setAnalysisResult({
        overall: { 
          passed: false, 
          confidence: 0, 
          message: 'Unable to extract data automatically. Please enter manually.' 
        }
      })
    }
  }, [relatedStepImage, currentStep.id, currentStep.aiConfig])

  const handleDataEntrySubmit = useCallback(() => {
    const cleanValue = dataEntryValue.replace(/[^0-9]/g, '')
    
    if (!cleanValue || currentStep.dataEntryConfig?.validation) {
      const validation = currentStep.dataEntryConfig?.validation
      if (validation) {
        const numValue = parseInt(cleanValue)
        if (validation.min && numValue < validation.min) {
          alert(`Value must be at least ${validation.min}`)
          return
        }
        if (validation.max && numValue > validation.max) {
          alert(`Value must be at most ${validation.max}`)
          return
        }
      }
    }
    
    const stepData = {
      timestamp: new Date(),
      action: 'manual' as const,
      stepTitle: currentStep.title,
      data: {
        amperage: cleanValue,
        unit: 'A',
        extractedValue: analysisResult?.extractedValue || undefined,
        userConfirmed: true
      },
      validationResults: {
        overall: { 
          passed: true, 
          confidence: 1, 
          message: 'Data entry confirmed by user' 
        },
        checks: {}
      },
      qualityScore: 1,
      requiresReview: false,
      retryCount: 0
    }
    
    saveSurveyData(currentStep.id, stepData)
    nextStep()
  }, [dataEntryValue, currentStep, analysisResult, saveSurveyData, nextStep])

  const handleCapture = useCallback(async () => {
    
    // Always try to get the current video element fresh
    const videoElement = document.querySelector('video') as HTMLVideoElement
    
    if (!videoElement) {
      console.error('No video element found in DOM')
      return
    }
    
    // Ensure we have the latest video element
    videoRef.current = videoElement
    
    // Check video readiness
    if (videoElement.readyState < 2) {
      console.error('Video element not ready:', videoElement.readyState)
      // Wait a bit and try again
      setTimeout(() => {
        handleCapture()
      }, 500)
      return
    }
    
    if (!cameraStream) {
      console.error('Camera stream not available')
      return
    }
    
    try {
      // Add timestamp to ensure uniqueness
      const captureTimestamp = Date.now()
      
      // Step 1: Capture image immediately using basic capture method
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }
      
      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth
      canvas.height = videoElement.videoHeight
      
      // IMPORTANT: Force video to play to ensure it's not paused/stale
      if (videoElement.paused) {
        await videoElement.play()
      }
      
      // Small delay to ensure we get the latest frame from the live stream
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      
      // Add a small watermark with timestamp to verify it's a new capture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '12px monospace'
      ctx.fillText(`Step ${currentStep.id} - ${new Date().toLocaleTimeString()}`, 10, canvas.height - 10)
      
      // Convert to base64 data URL with timestamp to prevent caching
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      // Show captured image to user immediately
      setCapturedImage(imageData)
      
      // Step 2: Start background analysis using backend API
      setIsAnalyzingCapture(true)
      
      // Send image to backend for analysis
      setTimeout(async () => {
        try {
          // Add a small delay to ensure we're sending the current image
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Convert image data to blob for API upload
          const response = await fetch(imageData)
          const blob = await response.blob()
          
          // Create form data for API upload
          const formData = new FormData()
          formData.append('image', blob, `capture-step-${currentStep.id}-${captureTimestamp}.jpg`)
          formData.append('step', currentStep.title.toLowerCase().replace(/\s+/g, '-'))
          formData.append('timestamp', new Date().toISOString())
          
          // Add AI configuration if available
          if (currentStep.aiConfig) {
            formData.append('userPrompt', currentStep.aiConfig.userPrompt)
          }
          
          // Call backend API for analysis
          const analysisResponse = await fetch('/api/analyze-meter', {
            method: 'POST',
            body: formData,
          })
          
          if (!analysisResponse.ok) {
            throw new Error(`Analysis API failed: ${analysisResponse.status}`)
          }
          
          const analysisResult = await analysisResponse.json()
          
          // Store results
          setAnalysisResult(analysisResult)
          setIsAnalyzingCapture(false)
          
        } catch (error) {
          console.error('Backend analysis failed:', error)
          setIsAnalyzingCapture(false)
          
          // Create fallback result
          setAnalysisResult({
            overall: { passed: false, confidence: 0, message: 'Backend analysis failed - please try again' }
          })
        }
      }, 500) // Shorter delay since we're using backend
      
    } catch (error) {
      console.error('Capture failed:', error)
    }
  }, [isCameraAvailable, cameraStream, cameraStatus, currentStep.aiConfig, currentStep.id, currentStep.title])

  // Handle proceeding to next step after analysis
  const handleProceed = useCallback(() => {
    if (!capturedImage || !analysisResult) return
    
    const stepData = {
      timestamp: new Date(),
      action: 'capture' as const,
      stepTitle: currentStep.title,
      imageData: capturedImage,
      validationResults: {
        overall: analysisResult.overall,
        checks: {}
      },
      qualityScore: analysisResult.overall.confidence,
      requiresReview: !analysisResult.overall.passed || retryCount >= 2,
      retryCount: retryCount
    }

    saveSurveyData(currentStep.id, stepData)
    
    // Clear captured image before moving to next step
    setCapturedImage(null)
    setAnalysisResult(null)
    
    nextStep()
  }, [capturedImage, analysisResult, currentStep.id, currentStep.title, saveSurveyData, nextStep, retryCount])

  // Handle retaking the photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setAnalysisResult(null)
    setIsAnalyzingCapture(false)
    setRetryCount(prev => prev + 1)
  }, [])

  const handleSkip = useCallback(() => {
    const stepData = {
      timestamp: new Date(),
      action: 'skip' as const,
      stepTitle: currentStep.title,
      validationResults: {
        overall: { passed: false, confidence: 0, message: 'Skipped by user' },
        checks: {}
      },
      qualityScore: 0,
      requiresReview: true,
      retryCount: 0
    }
    
    saveSurveyData(currentStep.id, stepData)
    nextStep()
  }, [currentStep.id, currentStep.title, saveSurveyData, nextStep])





  // For data entry steps, show a different UI
  if (isDataEntryStep) {
    return (
      <div className="flex flex-col w-screen h-screen overflow-hidden">
        <SurveyHeader />
        
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Instructions */}
            <div>
              <SurveyInstructions 
                instructions={currentStep.instructions}
                tips={currentStep.tips}
              />
            </div>
            
            {/* AI Analysis Result */}
            {isLoadingRelatedImage ? (
              <div className="bg-primary text-primary-foreground px-4 py-3 rounded-lg flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent"></div>
                <span>AI is reading the amperage value from your previous photo...</span>
              </div>
            ) : analysisResult?.extractedValue ? (
              <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg">
                <div className="font-medium">AI detected: {analysisResult.extractedValue.replace(/[^0-9]/g, '')}A</div>
                <div className="text-sm mt-1">Please confirm or correct this value below</div>
              </div>
            ) : analysisResult && !analysisResult.overall.passed ? (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg">
                <div className="font-medium">Unable to read amperage automatically</div>
                <div className="text-sm mt-1">Please enter the value manually</div>
              </div>
            ) : null}
            
            {/* Data Entry Form */}
            <div className="space-y-4">
              <div>
                <label htmlFor="amperage" className="block text-sm font-medium mb-2">
                  Main Disconnect Amperage
                </label>
                <div className="flex gap-2">
                  <Input
                    id="amperage"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={currentStep.dataEntryConfig?.placeholder || "Enter value"}
                    value={dataEntryValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataEntryValue(e.target.value)}
                    className="flex-1 text-lg"
                    disabled={isLoadingRelatedImage}
                  />
                  <span className="flex items-center px-3 text-lg font-medium">A</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Common values: 100A, 125A, 150A, 200A
                </p>
              </div>
              
              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDataEntrySubmit}
                  variant="default"
                  size="lg"
                  className={currentStep.skippable ? "flex-1" : "w-full"}
                  disabled={!dataEntryValue || isLoadingRelatedImage}
                >
                  Confirm & Continue
                </Button>
                {currentStep.skippable && (
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    size="lg"
                  >
                    Skip
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular camera step UI continues below...
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <SurveyHeader />
      
      {/* Camera View or Captured Image */}
      <div className="relative flex-1 overflow-hidden">
        {!capturedImage ? (
          <CameraView 
            key={`camera-${currentStep.id}`} // Force re-render on step change
            onCameraReady={(video) => {
              videoRef.current = video
            }}
          />
        ) : null}
        
        {/* Captured Image Display */}
        {capturedImage && (
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
                  {!analysisResult.overall.passed && (
                    <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg">
                      <div className="font-medium mb-2">Issues Found:</div>
                      <div className="text-sm">
                        • {analysisResult.overall.message}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            
            {/* Action Buttons - Only show when not analyzing and have results */}
            {!isAnalyzingCapture && analysisResult && (
              <div className="absolute bottom-24 sm:bottom-4 left-4 right-4">
                <div className="flex gap-3">
                  {analysisResult.overall.passed ? (
                    // Validation passed - only show Continue
                    <Button
                      onClick={handleProceed}
                      variant="default"
                      size="lg"
                      className="flex-1 py-4 text-lg font-semibold"
                    >
                      Continue
                    </Button>
                  ) : (
                    // Validation failed - show Retake (or Use Anyway after 2 attempts)
                    <>
                      <Button
                        onClick={handleRetake}
                        variant="outline"
                        size="lg"
                        className="flex-1 py-4 text-lg"
                      >
                        Retake Photo
                      </Button>
                      {retryCount >= 2 && (
                        <Button
                          onClick={handleProceed}
                          variant="destructive"
                          size="lg"
                          className="flex-1 py-4 text-lg"
                        >
                          Use Anyway
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
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
          className="absolute bottom-20 sm:bottom-4 inset-x-0 z-30"
          style={{ paddingBottom: `env(safe-area-inset-bottom)` }}
        >
          <SurveyInstructions 
            instructions={currentStep.instructions}
            tips={currentStep.tips}
          />
          <SurveyActions 
            onCapture={handleCapture}
            onSkip={currentStep.skippable ? handleSkip : undefined}
            isLastStep={progress.current === progress.total}
            isLoading={!cameraStream || !!capturedImage}
            captureLabel={
              !cameraStream ? "Starting Camera..." :
              capturedImage ? "Photo Captured" :
              "Take Picture"
            }
          />
        </div>
      </div>
    </div>
  )
} 