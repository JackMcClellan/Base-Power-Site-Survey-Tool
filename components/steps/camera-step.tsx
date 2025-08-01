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
  nextStepAtom, 
  saveStepDataAtom,
  surveyDataAtom,
  retakeModeAtom,
  currentStepAtom,
  type AnalysisResult
} from '@/atoms/survey'

import { SURVEY_STEPS } from '@/config/survey-steps'


export function CameraStep() {
  const currentStep = useAtomValue(currentStepDataAtom)
  const progress = useAtomValue(surveyProgressAtom)
  const surveyData = useAtomValue(surveyDataAtom)
  const retakeMode = useAtomValue(retakeModeAtom)
  const nextStep = useSetAtom(nextStepAtom)
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
      setIsCameraReady(false)
    }
  }, [currentStep.id])

  // For data entry steps, fetch and analyze the related image automatically
  useEffect(() => {
    if (isDataEntryStep && currentStep.dataEntryConfig?.relatedStepId && surveyId && !analysisResult && !isLoadingRelatedImage) {
      fetchAndAnalyzeRelatedImage()
    }
  }, [isDataEntryStep, currentStep.dataEntryConfig?.relatedStepId, currentStep.id, surveyId])

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
      
      // The keys are full S3 paths like "surveys/userId/step-10/timestamp-step-10-meter_photo-timestamp.jpg"
      // We need to check if the key contains both the step ID and 'meter_photo' in the path
      for (const [key, url] of Object.entries(imageResult.data.urls)) {
        // Check if this key is for the related step and is a meter photo
        if (key.includes(`/step-${relatedStepId}/`) && key.includes('-meter_photo-')) {
          relatedImageUrl = url as string
          break
        }
      }
      
      // Fallback: Also check for keys that might be stored differently
      if (!relatedImageUrl) {
        // Try to find any key that contains the step number
        for (const [key, url] of Object.entries(imageResult.data.urls)) {
          if (key.includes(`step-${relatedStepId}`) || key.includes(`step_${relatedStepId}`)) {
            console.log(`Found image with alternate key pattern: ${key}`)
            relatedImageUrl = url as string
            break
          }
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
      formData.append('step', `data-entry-${currentStep.id}`)
      formData.append('timestamp', new Date().toISOString())
      formData.append('isDataExtraction', 'true')
      
      // Add AI configuration
      if (currentStep.aiConfig) {
        formData.append('userPrompt', currentStep.aiConfig.userPrompt)
        if (currentStep.aiConfig.structuredFields) {
          formData.append('structuredFields', JSON.stringify(currentStep.aiConfig.structuredFields))
        }
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
  }, [currentStep.dataEntryConfig?.relatedStepId, currentStep.id, currentStep.aiConfig, surveyId])

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
      action: 'retry' as const,
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
    
    // Get the actual next step ID
    const nextStepId = getNextStepId(currentStep.id)
    
    // Check if in retake mode
    if (retakeMode.isRetaking && retakeMode.returnToReview) {
      // Don't update backend step number during retake
      await updateCurrentStep({ 
        step: currentStep.id, // Keep the same step number
        stepData: {
          [`step_${currentStep.id}`]: {
            ...stepData,
            enteredValue: `${cleanValue}A`
          }
        }
      })
      
      // Clear retake mode and return to review
      setRetakeMode({ isRetaking: false, returnToReview: false })
      const reviewStepNumber = Math.max(...SURVEY_STEPS.filter(step => step.stepType !== 'guide').map(step => step.id)) + 1
      setCurrentStep(reviewStepNumber)
    } else {
      // Normal flow - update backend with actual next step ID
      await updateCurrentStep({ 
        step: nextStepId,
        stepData: {
          [`step_${currentStep.id}`]: {
            ...stepData,
            enteredValue: `${cleanValue}A`
          }
        }
      })
      
      nextStep()
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
          formData.append('image', blob, `capture-step-${currentStep.id}-${captureTimestamp}.jpg`)
          formData.append('step', currentStep.title.toLowerCase().replace(/\s+/g, '-'))
          formData.append('timestamp', new Date().toISOString())
          
          // Add AI configuration if available
          if (currentStep.aiConfig) {
            formData.append('userPrompt', currentStep.aiConfig.userPrompt)
            if (currentStep.aiConfig.structuredFields) {
              formData.append('structuredFields', JSON.stringify(currentStep.aiConfig.structuredFields))
            }
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
          
          // If the image passed validation, automatically save progress
          if (analysisResult.overall?.passed) {
            console.log('Image passed validation, auto-saving progress...')
            
            // Upload image and save progress automatically
            try {
              // Get the blob from canvas reference if available
              let blob: Blob
              if (canvasBlobRef.current) {
                try {
                  blob = await canvasBlobRef.current
                  canvasBlobRef.current = null
                } catch {
                  const response = await fetch(imageData)
                  blob = await response.blob()
                }
              } else {
                const response = await fetch(imageData)
                blob = await response.blob()
              }
              
              const file = new File([blob], `step-${currentStep.id}-capture.jpg`, { type: 'image/jpeg' })
              
              console.log('Auto-saving: Uploading image to S3...')
              await uploadImage({
                file,
                stepId: currentStep.id,
                imageType: 'meter_photo'
              })
              console.log('Auto-saving: Image uploaded successfully')
              
              // Save step data
              const stepData = {
                timestamp: new Date(),
                action: 'capture' as const,
                validated: true,
                validationResult: analysisResult.overall,
                imageUploaded: true,
                retryCount: retryCount
              }
              
              saveStepData(currentStep.id, stepData)
              
              // Update backend with completed step
              await updateCurrentStep({ 
                step: currentStep.id,
                stepData: {
                  [`step_${currentStep.id}`]: {
                    ...stepData,
                    extractedValue: ('extractedValue' in analysisResult ? analysisResult.extractedValue : null) || null,
                    structuredData: ('structuredData' in analysisResult ? analysisResult.structuredData : undefined) || undefined
                  }
                }
              })
              
              console.log('Auto-save complete! Progress saved.')
            } catch (autoSaveError) {
              console.error('Auto-save failed:', autoSaveError)
              // Don't show error to user - they can still manually proceed
            }
          }
          
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
  }, [isCameraReady, currentStep.aiConfig, currentStep.id, currentStep.title])

  // Add helper function to get next step ID
  const getNextStepId = (currentId: number) => {
    const stepSequence = SURVEY_STEPS
      .map(step => step.id)
      .sort((a, b) => a - b)
    
    const currentIndex = stepSequence.indexOf(currentId)
    if (currentIndex >= 0 && currentIndex < stepSequence.length - 1) {
      return stepSequence[currentIndex + 1]
    }
    
    // If not found in sequence or at end, go to review
    const maxStepId = Math.max(...SURVEY_STEPS.filter(step => step.stepType !== 'guide').map(step => step.id))
    return maxStepId + 1 // Review step
  }

  // Handle proceeding to next step after analysis
  const handleProceed = useCallback(async () => {
    if (!capturedImage || !analysisResult) return
    
    try {
      // Check if data was already saved by auto-save
      const currentStepData = surveyData.stepData[currentStep.id]
      const alreadySaved = currentStepData?.validated && currentStepData?.imageUploaded
      
      if (!alreadySaved) {
        // If not auto-saved (e.g., user clicked continue before validation), save now
        console.log('Data not auto-saved, saving now...')
        
        // Upload image to S3 first
        if (capturedImage) {
          try {
            console.log('Converting captured image to blob...')
            
            let blob: Blob
          
          // First try to use the canvas blob if available (most reliable)
          if (canvasBlobRef.current) {
            try {
              console.log('Using canvas blob method...')
              blob = await canvasBlobRef.current
              canvasBlobRef.current = null // Clear after use
            } catch (canvasError) {
              console.warn('Canvas blob failed:', canvasError)
              
              // Fallback to fetch method
              try {
                const response = await fetch(capturedImage)
                if (!response.ok) {
                  throw new Error(`Failed to fetch captured image: ${response.status}`)
                }
                blob = await response.blob()
              } catch (fetchError) {
                console.warn('Fetch also failed, trying base64 decode:', fetchError)
                
                // Last resort: manually convert base64 to blob
                const base64Data = capturedImage.split(',')[1]
                if (!base64Data) {
                  throw new Error('Invalid data URL format')
                }
                
                const byteCharacters = atob(base64Data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                blob = new Blob([byteArray], { type: 'image/jpeg' })
              }
            }
          } else {
            // No canvas blob available, use fetch approach
            try {
              const response = await fetch(capturedImage)
              if (!response.ok) {
                throw new Error(`Failed to fetch captured image: ${response.status}`)
              }
              blob = await response.blob()
            } catch (fetchError) {
              console.warn('Fetch failed, trying alternative method:', fetchError)
              
              // Alternative method: manually convert base64 to blob
              const base64Data = capturedImage.split(',')[1]
              if (!base64Data) {
                throw new Error('Invalid data URL format')
              }
              
              const byteCharacters = atob(base64Data)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              blob = new Blob([byteArray], { type: 'image/jpeg' })
            }
          }
          
          console.log('Blob created:', {
            size: blob.size,
            type: blob.type
          })
          
          // Ensure we have a valid blob
          if (blob.size === 0) {
            throw new Error('Invalid image data - blob is empty')
          }
          
          const file = new File([blob], `step-${currentStep.id}-capture.jpg`, { type: 'image/jpeg' })
          
          console.log('Attempting to upload image:', {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })
          
          await uploadImage({
            file,
            stepId: currentStep.id,
            imageType: 'meter_photo'
          })
          console.log('Image upload successful')
        } catch (uploadError) {
          console.error('Image processing/upload failed:', uploadError)
          const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error'
          
          // More user-friendly error messages
          if (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
            alert('Failed to process the captured image. This might be due to browser restrictions. You can continue, but the image won\'t be saved.')
          } else {
            alert(`Failed to upload image: ${errorMessage}. You can still continue, but the image won't be saved.`)
          }
          // Don't prevent progression, just log the error
        }
        }
        
        const stepData = {
          timestamp: new Date(),
          action: 'capture' as const,
          validated: analysisResult.overall.passed,
          validationResult: analysisResult.overall,
          imageUploaded: true,
          retryCount: retryCount,
          extractedValue: analysisResult.extractedValue,
          structuredData: analysisResult.structuredData
        }

        saveStepData(currentStep.id, stepData)
        
        // Update backend - if in retake mode, don't advance step
        if (retakeMode.isRetaking && retakeMode.returnToReview) {
          // Just update the step data without changing step number
          await updateCurrentStep({ 
            step: currentStep.id, // Keep the same step number
            stepData: {
              [`step_${currentStep.id}`]: {
                ...stepData,
                extractedValue: ('extractedValue' in analysisResult ? analysisResult.extractedValue : null) || null,
                structuredData: ('structuredData' in analysisResult ? analysisResult.structuredData : undefined) || undefined
              }
            }
          })
        } else {
          // Normal flow - update backend with actual next step ID
          const nextStepId = getNextStepId(currentStep.id)
          await updateCurrentStep({ 
            step: nextStepId,
            stepData: {
              [`step_${currentStep.id}`]: {
                ...stepData,
                extractedValue: ('extractedValue' in analysisResult ? analysisResult.extractedValue : null) || null,
                structuredData: ('structuredData' in analysisResult ? analysisResult.structuredData : undefined) || undefined
              }
            }
          })
        }
      } else {
        console.log('Data already auto-saved, just moving to next step')
        
        // In retake mode, don't update step number
        if (!retakeMode.isRetaking || !retakeMode.returnToReview) {
          // Update backend to the actual next step ID
          const nextStepId = getNextStepId(currentStep.id)
          await updateCurrentStep({ 
            step: nextStepId
          })
        }
      }
      
      // Clear captured image before moving to next step
      setCapturedImage(null)
      setAnalysisResult(null)
      
      // Check if in retake mode
      if (retakeMode.isRetaking && retakeMode.returnToReview) {
        // Clear retake mode and return to review
        setRetakeMode({ isRetaking: false, returnToReview: false })
        const reviewStepNumber = Math.max(...SURVEY_STEPS.filter(step => step.stepType !== 'guide').map(step => step.id)) + 1
        setCurrentStep(reviewStepNumber)
      } else {
        nextStep()
      }
    } catch (error) {
      console.error('Failed to proceed:', error)
      // Still allow navigation even if backend fails
      if (retakeMode.isRetaking && retakeMode.returnToReview) {
        // Clear retake mode and return to review
        setRetakeMode({ isRetaking: false, returnToReview: false })
        const reviewStepNumber = Math.max(...SURVEY_STEPS.filter(step => step.stepType !== 'guide').map(step => step.id)) + 1
        setCurrentStep(reviewStepNumber)
      } else {
        nextStep()
      }
    }
  }, [capturedImage, analysisResult, currentStep.id, saveStepData, nextStep, retryCount, uploadImage, updateCurrentStep, surveyData.stepData, retakeMode, setRetakeMode, setCurrentStep])

  // Handle retaking the photo
  const handleRetake = useCallback(() => {
    setCapturedImage(null)
    setAnalysisResult(null)
    setIsAnalyzingCapture(false)
    setRetryCount(prev => prev + 1)
    canvasBlobRef.current = null // Clear any stored blob
  }, [])

  const handleSkip = useCallback(async () => {
    const stepData = {
      timestamp: new Date(),
      action: 'skip' as const,
      validated: false,
      validationResult: { passed: false, confidence: 0, message: 'Skipped by user' },
      imageUploaded: false,
      retryCount: 0
    }
    
    saveStepData(currentStep.id, stepData)
    
    // Get the actual next step ID
    const nextStepId = getNextStepId(currentStep.id)
    
    // Check if in retake mode
    if (retakeMode.isRetaking && retakeMode.returnToReview) {
      // Just update the step data without changing step number
      await updateCurrentStep({ 
        step: currentStep.id, // Keep the same step number
        stepData: {
          [`step_${currentStep.id}`]: stepData
        }
      })
      
      // Clear retake mode and return to review
      setRetakeMode({ isRetaking: false, returnToReview: false })
      const reviewStepNumber = Math.max(...SURVEY_STEPS.filter(step => step.stepType !== 'guide').map(step => step.id)) + 1
      setCurrentStep(reviewStepNumber)
    } else {
      // Normal flow - update backend with actual next step ID
      await updateCurrentStep({ 
        step: nextStepId,
        stepData: {
          [`step_${currentStep.id}`]: stepData
        }
      })
      
      nextStep()
    }
  }, [currentStep.id, currentStep.title, saveStepData, nextStep, updateCurrentStep, retakeMode, setRetakeMode, setCurrentStep])





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
              ) : analysisResult && !analysisResult.overall.passed ? (
                <div className="space-y-3">
                  <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg">
                    <div className="font-medium mb-2">Issues Found:</div>
                    <div className="text-sm">
                      • {analysisResult.overall.message}
                    </div>
                  </div>
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