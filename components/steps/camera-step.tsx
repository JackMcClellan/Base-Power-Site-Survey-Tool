'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { CameraView } from '@/components/camera-view'
import { SurveyHeader } from '@/components/shared/survey-header'
import { SurveyInstructions } from '@/components/shared/survey-instructions'
import { SurveyActions } from '@/components/shared/survey-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSurveyBackend } from '@/hooks/use-survey-backend'

// Overlays removed - clean camera view only

import { 
  currentStepDataAtom, 
  surveyProgressAtom, 
  saveStepDataAtom,
  surveyDataAtom,
  retakeModeAtom,
  currentStepAtom,
  type AnalysisResult
} from '@/atoms/survey'

import { getNextStepId as getNextStepIdFromConfig, getReviewStepId } from '@/lib/survey-steps-config'


export function CameraStep() {
  const currentStep = useAtomValue(currentStepDataAtom)
  const progress = useAtomValue(surveyProgressAtom)
  const surveyData = useAtomValue(surveyDataAtom)
  const retakeMode = useAtomValue(retakeModeAtom)
  const setCurrentStep = useSetAtom(currentStepAtom)
  const setRetakeMode = useSetAtom(retakeModeAtom)
  const saveStepData = useSetAtom(saveStepDataAtom)
  const { updateCurrentStep, uploadImage, surveyId } = useSurveyBackend()
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzingCapture, setIsAnalyzingCapture] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [dataEntryValue, setDataEntryValue] = useState<string>('')
  const [isLoadingRelatedImage, setIsLoadingRelatedImage] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const canvasBlobRef = useRef<Promise<Blob> | null>(null)

  // Remove useCamera hook since CameraView handles it
  
  // Check if this is a data entry step
  const isDataEntryStep = currentStep.stepType === 'data-entry'
  
  // Related step images are now handled by backend S3 storage
  
  // Backend API will handle image analysis after capture

  // Overlays removed - camera now has clean view without any AR elements

  // Video element ref for basic capture
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Reset capture state when step changes
  useEffect(() => {
    // Always reset all state when step changes
    setCapturedImage(null)
    setAnalysisResult(null)
    setIsAnalyzingCapture(false)
    setRetryCount(0) // Reset retry count for new step
    setDataEntryValue('') // Reset data entry value
    setIsLoadingRelatedImage(false)
    setIsCameraReady(false) // Reset camera ready state
    canvasBlobRef.current = null // Clear any stored blob
    
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
              // Ignore play errors
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
      setIsCameraReady(false)
    }
  }, [currentStep.id])

  // For data entry steps, fetch and analyze the related image automatically
  useEffect(() => {
    console.log('Data entry effect check:', {
      isDataEntryStep,
      relatedStepId: currentStep.dataEntryConfig?.relatedStepId,
      surveyId,
      hasAnalysisResult: !!analysisResult,
      isLoadingRelatedImage
    })
    
    if (isDataEntryStep && currentStep.dataEntryConfig?.relatedStepId && surveyId && !analysisResult && !isLoadingRelatedImage) {
      console.log('Starting fetchAndAnalyzeRelatedImage for step:', currentStep.id)
      fetchAndAnalyzeRelatedImage()
    }
  }, [isDataEntryStep, currentStep.dataEntryConfig?.relatedStepId, currentStep.id, surveyId, analysisResult, isLoadingRelatedImage])

  const fetchAndAnalyzeRelatedImage = useCallback(async () => {
    if (!currentStep.dataEntryConfig?.relatedStepId || !surveyId) return
    
    setIsAnalyzingCapture(true)
    setIsLoadingRelatedImage(true)
    
    try {
      // Step 1: Fetch image URLs from S3
      const imageResponse = await fetch(`/api/images/${surveyId}`)
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch images: ${imageResponse.status}`)
      }
      
      const imageResult = await imageResponse.json()
      
      if (!imageResult.success || !imageResult.data?.urls) {
        throw new Error('No images found')
      }
      
      console.log('Available image URLs:', Object.keys(imageResult.data.urls))
      
      // Find the related step's image URL
      const relatedStepId = currentStep.dataEntryConfig.relatedStepId
      let relatedImageUrl = null
      
      // The keys are now simple: "userId/step_X.jpg"
      const expectedKey = `step_${relatedStepId}.jpg`
      
      for (const [key, url] of Object.entries(imageResult.data.urls)) {
        // Check if this key matches the expected pattern
        if (key.endsWith(expectedKey)) {
          relatedImageUrl = url as string
          console.log(`Found image for step ${relatedStepId}: ${key}`)
          break
        }
      }
      
      if (!relatedImageUrl) {
        console.error(`No image found for step ${relatedStepId}. Available keys:`, Object.keys(imageResult.data.urls))
        throw new Error(`No image found for step ${currentStep.dataEntryConfig.relatedStepId}. Please ensure step ${relatedStepId} has been completed and the image was uploaded successfully.`)
      }
      
      // Step 2: Fetch the image from S3
      const imageDataResponse = await fetch(relatedImageUrl)
      if (!imageDataResponse.ok) {
        throw new Error('Failed to fetch image from S3')
      }
      
      const blob = await imageDataResponse.blob()
      
      // Step 3: Send to AI for analysis
      const formData = new FormData()
      formData.append('image', blob, 'related-image.jpg')
      formData.append('stepNumber', currentStep.id.toString())
      formData.append('surveyId', surveyId)
      
      // Call backend API for validation
      const analysisResponse = await fetch('/api/validate', {
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
        isValid: false, 
        message: 'Unable to extract data automatically. Please enter manually.',
        confidence: 0 
      })
    }
  }, [currentStep.dataEntryConfig?.relatedStepId, currentStep.id, surveyId])

  const handleDataEntrySubmit = async () => {
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
      action: 'retry' as const, // Using retry for data entry
      validated: true,
      validationResult: { 
        passed: true, 
        confidence: 1, 
        message: 'Data entry confirmed by user' 
      },
      imageUploaded: false, // No image for manual entry
      retryCount: 0
    }
    
    saveStepData(currentStep.id, stepData)
    
    try {
      // Use validate API to save data entry (consistent with photo and skip)
      const formData = new FormData()
      formData.append('stepNumber', currentStep.id.toString())
      formData.append('surveyId', surveyId!)
      formData.append('dataEntry', 'true')
      formData.append('enteredValue', `${cleanValue}A`)
      
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Data entry API failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Data entry saved:', result)
      
    } catch (error) {
      console.error('Failed to save data entry:', error)
      // Continue anyway - don't block user progress
    }
    
    // Get the actual next step ID
    const nextStepId = getNextStepIdFromConfig(currentStep.id)
    
    // Check if in retake mode
    if (retakeMode.isRetaking && retakeMode.returnToReview) {
      // Clear retake mode and return to review
      setRetakeMode({ isRetaking: false, returnToReview: false })
      const reviewStepNumber = getReviewStepId()
      setCurrentStep(reviewStepNumber)
    } else {
      // Normal flow - advance to next step
      setCurrentStep(nextStepId)
    }
  }



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
    
    if (!isCameraReady) {
      console.error('Camera not ready yet')
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
      
      // Store a reference to the canvas blob conversion function for later use
      canvasBlobRef.current = new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob failed'))
          }
        }, 'image/jpeg', 0.9)
      })
      
      // Add a small watermark with timestamp to verify it's a new capture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '12px monospace'
      ctx.fillText(`Step ${currentStep.id} - ${new Date().toLocaleTimeString()}`, 10, canvas.height - 10)
      
      // Convert to base64 data URL for display
      const imageData = canvas.toDataURL('image/jpeg', 0.9)
      
      // Validate the data URL
      if (!imageData || imageData === 'data:,') {
        throw new Error('Failed to capture image from camera')
      }
      
      console.log('Image captured:', {
        dataUrlLength: imageData.length,
        dataUrlPrefix: imageData.substring(0, 50) + '...'
      })
      
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
          formData.append('image', blob, `step_${currentStep.id}.jpg`)
          formData.append('stepNumber', currentStep.id.toString())
          formData.append('surveyId', surveyId!)
                
      // Call backend API for validation
      const analysisResponse = await fetch('/api/validate', {
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
          
          // If the image passed validation, automatically save progress
          if (analysisResult.isValid) {
            console.log('Image passed validation, auto-saving progress...')
            
            // The validate API has already uploaded the image and saved to database
            // We only need to update local state and advance the step
            
            // Save step data locally
            const stepData = {
              timestamp: new Date(),
              action: 'capture' as const,
              validated: true,
              validationResult: {
                passed: analysisResult.isValid,
                confidence: analysisResult.confidence,
                message: analysisResult.message
              },
              imageUploaded: true, // Images are always uploaded now
              retryCount: retryCount
            }
            
            saveStepData(currentStep.id, stepData)
            
            // The backend has already updated the step in the database
            // Calculate next step locally and update frontend state
            if (analysisResult.isValid && !retakeMode.isRetaking) {
              const nextStepId = getNextStepIdFromConfig(currentStep.id)
              console.log('Backend validated image, advancing to step:', nextStepId)
              setCurrentStep(nextStepId)
            }
            
            console.log('Auto-save complete! Progress saved.')
          }
          
        } catch (error) {
          console.error('Backend analysis failed:', error)
          setIsAnalyzingCapture(false)
          
          // Create fallback result
          setAnalysisResult({
            isValid: false,
            message: 'Backend analysis failed - please try again',
            confidence: 0
          })
        }
      }, 500) // Shorter delay since we're using backend
      
    } catch (error) {
      console.error('Capture failed:', error)
    }
  }, [isCameraReady, currentStep.id, currentStep.title, surveyId, uploadImage, saveStepData, updateCurrentStep, retryCount, retakeMode.isRetaking, setCurrentStep])

  // Use helper function from survey config instead of duplicating logic

  // Handle proceeding to next step after analysis
  const handleProceed = useCallback(async () => {
    if (!capturedImage || !analysisResult) return
    
    try {
      // Check if data was already saved by auto-save
      const currentStepData = surveyData.stepData[currentStep.id]
      const alreadySaved = currentStepData?.validated && currentStepData?.imageUploaded
      
      if (!alreadySaved) {
        // The validate API has already uploaded the image and saved to database
        // We only need to update local state
        console.log('Updating local state...')
        
        const stepData = {
          timestamp: new Date(),
          action: 'capture' as const,
          validated: analysisResult.isValid,
          validationResult: {
            passed: analysisResult.isValid,
            confidence: analysisResult.confidence,
            message: analysisResult.message
          },
          imageUploaded: true, // Images are always uploaded now
          retryCount: retryCount
        }

        saveStepData(currentStep.id, stepData)
        
        // For manual "Use Anyway" case, we need to update backend step number
        if (!analysisResult.isValid) {
          // Manual progression for failed validation
          const nextStepId = getNextStepIdFromConfig(currentStep.id)
          
          if (retakeMode.isRetaking && retakeMode.returnToReview) {
            // Just update the step data without changing step number
            await updateCurrentStep({ 
              step: currentStep.id, // Keep the same step number
              stepData: {
                [`step_${currentStep.id}`]: stepData
              }
            })
          } else {
            // Normal flow - update backend with actual next step ID
            await updateCurrentStep({ 
              step: nextStepId,
              stepData: {
                [`step_${currentStep.id}`]: stepData
              }
            })
            // Update frontend state to match backend
            setCurrentStep(nextStepId)
          }
        }
      } else {
        console.log('Data already auto-saved, just moving to next step')
        
        // If validation passed, backend already updated the step
        // Calculate next step locally since we don't get it from backend anymore
        if (analysisResult.isValid && !retakeMode.isRetaking) {
          const nextStepId = getNextStepIdFromConfig(currentStep.id)
          setCurrentStep(nextStepId)
        }
      }
      
      // Clear captured image before moving to next step
      setCapturedImage(null)
      setAnalysisResult(null)
      
      // Check if in retake mode
      if (retakeMode.isRetaking && retakeMode.returnToReview) {
        // Clear retake mode and return to review
        setRetakeMode({ isRetaking: false, returnToReview: false })
        const reviewStepNumber = getReviewStepId()
        setCurrentStep(reviewStepNumber)
      }
    } catch (error) {
      console.error('Failed to proceed:', error)
      // Still allow navigation even if backend fails
      if (retakeMode.isRetaking && retakeMode.returnToReview) {
        // Clear retake mode and return to review
        setRetakeMode({ isRetaking: false, returnToReview: false })
        const reviewStepNumber = getReviewStepId()
        setCurrentStep(reviewStepNumber)
      } else {
        // Fall back to local navigation if backend fails
        const nextStepId = getNextStepIdFromConfig(currentStep.id)
        setCurrentStep(nextStepId)
      }
    }
  }, [capturedImage, analysisResult, currentStep.id, saveStepData, retryCount, updateCurrentStep, surveyData.stepData, retakeMode, setRetakeMode, setCurrentStep])

  // Handle retaking the photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setAnalysisResult(null)
    setIsAnalyzingCapture(false)
    setRetryCount(prev => prev + 1)
    canvasBlobRef.current = null // Clear any stored blob
  }, [])

  const handleSkip = useCallback(async () => {
    console.log('Processing skip for step:', currentStep.id)
    
    // Save to local state
    const localStepData = {
      timestamp: new Date(),
      action: 'skip' as const,
      validated: false,
      validationResult: { passed: false, confidence: 0, message: 'Skipped by user' },
      imageUploaded: false,
      retryCount: 0
    }
    saveStepData(currentStep.id, localStepData)
    
    try {
      // Call validate API with skip flag
      const formData = new FormData()
      formData.append('stepNumber', currentStep.id.toString())
      formData.append('surveyId', surveyId!)
      formData.append('skip', 'true')
      
      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Skip API failed: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Skip recorded:', result)
      
    } catch (error) {
      console.error('Failed to record skip:', error)
      // Continue anyway - don't block user progress
    }
    
    // Get the actual next step ID
    const nextStepId = getNextStepIdFromConfig(currentStep.id)
    
    // Check if in retake mode
    if (retakeMode.isRetaking && retakeMode.returnToReview) {
      // Just update the step number without changing it
      await updateCurrentStep({ 
        step: currentStep.id,
      })
      
      // Clear retake mode and return to review
      setRetakeMode({ isRetaking: false, returnToReview: false })
      const reviewStepNumber = getReviewStepId()
      setCurrentStep(reviewStepNumber)
    } else {
      // Normal flow - update backend with actual next step ID
      await updateCurrentStep({ 
        step: nextStepId,
      })
      
      // Update frontend to match backend
      setCurrentStep(nextStepId)
    }
  }, [currentStep.id, saveStepData, updateCurrentStep, retakeMode, setRetakeMode, setCurrentStep, surveyId])





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
            ) : analysisResult && !analysisResult.isValid ? (
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
              setIsCameraReady(true)
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
              ) : analysisResult && !analysisResult.isValid ? (
                <div className="space-y-3">
                  <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg">
                    <div className="font-medium mb-2">Issues Found:</div>
                    <div className="text-sm">
                      • {analysisResult.message}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Action Buttons - Only show when not analyzing and have results */}
            {!isAnalyzingCapture && analysisResult && (
              <div className="absolute bottom-24 sm:bottom-4 left-4 right-4">
                <div className="flex gap-3">
                  {analysisResult.isValid ? (
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
          {/* Only show actions when camera is ready and no image is captured */}
          {isCameraReady && !capturedImage && (
            <SurveyActions 
              onCapture={handleCapture}
              onSkip={currentStep.skippable ? handleSkip : undefined}
              isLastStep={progress.current === progress.total}
              isLoading={false}
              captureLabel="Take Picture"
            />
          )}
        </div>
      </div>
    </div>
  )
} 