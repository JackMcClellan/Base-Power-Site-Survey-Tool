'use client'

import React, { useState, useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { surveyDataAtom, currentStepAtom, retakeModeAtom } from '@/atoms/survey'
import { SurveyHeader } from '@/components/shared/survey-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSurveyBackend } from '@/hooks/use-survey-backend'
import { ThankYou } from '@/components/thank-you'
import { SURVEY_STEPS } from '@/config/survey-steps'

interface SurveyDataFromBackend {
  id: string
  userId: string
  currentStep: number
  status: string
  meterPhotos?: Record<string, unknown>
  analysisResults?: Record<string, unknown>
  surveyResponses?: Record<string, unknown>
  [key: string]: unknown
}

export function ReviewStep() {
  const surveyData = useAtomValue(surveyDataAtom)
  const setCurrentStep = useSetAtom(currentStepAtom)
  const setRetakeMode = useSetAtom(retakeModeAtom)
  const [showThankYou, setShowThankYou] = useState(false)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [isLoadingImages, setIsLoadingImages] = useState(true)
  const [backendSurveyData, setBackendSurveyData] = useState<SurveyDataFromBackend | null>(null)
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(true)
  const { completeSurvey, surveyId } = useSurveyBackend()

  // Fetch survey data and images from backend when component mounts
  useEffect(() => {
    async function fetchSurveyData() {
      if (!surveyId) return
      
      try {
        setIsLoadingSurvey(true)
        // Fetch complete survey data
        const surveyResponse = await fetch(`/api/survey/${surveyId}`)
        if (surveyResponse.ok) {
          const surveyResult = await surveyResponse.json()
          if (surveyResult.success && surveyResult.data) {
            setBackendSurveyData(surveyResult.data)
          }
        }

        // Fetch image URLs
        setIsLoadingImages(true)
        const imageResponse = await fetch(`/api/images/${surveyId}`)
        
        if (imageResponse.ok) {
          const imageResult = await imageResponse.json()
          if (imageResult.success && imageResult.data?.urls) {
            setImageUrls(imageResult.data.urls)
          }
        }
      } catch (error) {
        console.error('Failed to fetch survey data:', error)
      } finally {
        setIsLoadingImages(false)
        setIsLoadingSurvey(false)
      }
    }

    fetchSurveyData()
  }, [surveyId])

  // Helper function to check if a step is completed
  const isStepCompleted = (stepId: number): boolean => {
    if (backendSurveyData?.surveyResponses) {
      const stepKey = `step_${stepId}`
      const stepData = backendSurveyData.surveyResponses[stepKey]
      return !!stepData && typeof stepData === 'object' && 
             ('action' in stepData || 'enteredValue' in stepData || 'validationResult' in stepData)
    }
    return false
  }

  // Helper function to get step data
  const getStepData = (stepId: number): Record<string, unknown> | null => {
    if (backendSurveyData?.surveyResponses) {
      const stepKey = `step_${stepId}`
      return backendSurveyData.surveyResponses[stepKey] as Record<string, unknown> || null
    }
    return null
  }

  // Helper function to get entered value for a step
  const getEnteredValue = (stepId: number): string | null => {
    const stepData = getStepData(stepId)
    if (stepData && typeof stepData === 'object' && 'enteredValue' in stepData) {
      return stepData.enteredValue as string
    }
    return null
  }

  const handleFinishSurvey = async () => {
    try {
      // Complete the survey in the backend
      const success = await completeSurvey({
        finalData: {
          totalSteps: SURVEY_STEPS.length,
          completionTime: new Date().toISOString()
        },
        completionNotes: 'Survey completed successfully'
      })

      if (success) {
        setShowThankYou(true)
      } else {
        console.error('Failed to complete survey in backend')
        alert('Failed to complete survey. Please try again or contact support if the issue persists.')
      }
    } catch (error) {
      console.error('Error completing survey:', error)
      alert(`Error completing survey: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRetakePhoto = (stepId: number) => {
    // Set retake mode before navigating
    setRetakeMode({
      isRetaking: true,
      returnToReview: true,
      originalStep: stepId
    })
    // Navigate back to the specific step
    setCurrentStep(stepId)
  }

  // Show thank you page if survey is finished
  if (showThankYou || backendSurveyData?.status === 'COMPLETED') {
    return <ThankYou />
  }

  // Show loading state while fetching survey data
  if (isLoadingSurvey) {
    return (
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
        <SurveyHeader showStepNumber={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading survey data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <SurveyHeader showStepNumber={false} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">Electricity Meter Survey Complete!</CardTitle>
              <CardDescription>
                Your electricity meter assessment has been completed. Here&apos;s a comprehensive summary of your electrical installation analysis.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Step Details */}
          <Card>
            <CardHeader>
              <CardTitle>Survey Details</CardTitle>
              <CardDescription>
                Detailed breakdown of each completed step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {SURVEY_STEPS.map((step) => {
                  const stepCompleted = isStepCompleted(step.id)
                  const data = getStepData(step.id)
                  
                  // Find the image URL for this step
                  const stepImageKey = Object.keys(imageUrls).find(key => key.includes(`step-${step.id}`))
                  const imageUrl = stepImageKey ? imageUrls[stepImageKey] : null

                  return (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Step {step.id}
                            </Badge>
                            <span>{step.title}</span>
                            {!stepCompleted && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                Not Completed
                              </Badge>
                            )}
                            {data?.action === 'skip' && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                Skipped
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>

                      {/* Only show content if step is completed */}
                      {stepCompleted && (
                        <>
                          {/* Data Entry Display */}
                          {step.stepType === 'data-entry' && (
                            <div className="mb-4 p-4 bg-muted rounded-lg">
                              {data?.action === 'skip' ? (
                                <p className="text-sm text-muted-foreground">No value entered (skipped)</p>
                              ) : (
                                <>
                                  <p className="text-lg font-semibold">
                                    Entered Value: {getEnteredValue(step.id) || 'No value'}
                                  </p>
                                  {data?.validationResult && typeof data.validationResult === 'object' && 'message' in data.validationResult && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {(data.validationResult as {message: string}).message}
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {/* Image Preview */}
                          {data?.imageUploaded && step.stepType !== 'data-entry' && (
                            <div className="space-y-3">
                              {isLoadingImages ? (
                                <div className="w-full max-w-md rounded-lg border bg-gray-100 h-64 flex items-center justify-center">
                                  <p className="text-gray-500">Loading image...</p>
                                </div>
                              ) : imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={`${step.title} photo`}
                                  className="w-full max-w-md rounded-lg border object-contain"
                                  style={{ maxHeight: '400px' }}
                                />
                              ) : (
                                <div className="w-full max-w-md rounded-lg border bg-gray-100 h-64 flex items-center justify-center">
                                  <p className="text-gray-500">Image not available</p>
                                </div>
                              )}
                              <Button
                                onClick={() => handleRetakePhoto(step.id)}
                                variant="outline"
                                size="sm"
                              >
                                Retake Photo
                              </Button>
                            </div>
                          )}

                          {/* For data entry steps, show option to re-enter */}
                          {step.stepType === 'data-entry' && (
                            <Button
                              onClick={() => handleRetakePhoto(step.id)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Edit Value
                            </Button>
                          )}
                        </>
                      )}

                      {/* Show option to complete incomplete steps */}
                      {!stepCompleted && (
                        <div className="mt-3">
                          <Button
                            onClick={() => handleRetakePhoto(step.id)}
                            variant="default"
                            size="sm"
                          >
                            Complete This Step
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* Bottom Actions */}
      <div 
        className="px-6 py-4 bg-card border-t"
        style={{ paddingBottom: `calc(16px + env(safe-area-inset-bottom))` }}
      >
        <div className="max-w-4xl mx-auto">
          <Button 
            onClick={handleFinishSurvey}
            variant="default"
            size="lg"
            className="w-full font-semibold"
            disabled={surveyData.currentlySyncing}
          >
            {surveyData.currentlySyncing ? 'Submitting...' : 'Finish Survey'}
          </Button>
        </div>
      </div>
    </div>
  )
} 