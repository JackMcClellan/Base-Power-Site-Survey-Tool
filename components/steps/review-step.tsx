'use client'

import { useState, useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { surveyDataAtom, currentStepAtom, retakeModeAtom } from '@/atoms/survey'
import { SurveyHeader } from '@/components/shared/survey-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSurveyBackend } from '@/hooks/use-survey-backend'
import { ThankYou } from '@/components/thank-you'
import { CAMERA_STEPS } from '@/config/survey-steps'
import type { StepData } from '@/lib/database'

interface SurveyDataFromBackend {
  id: string
  userId: string
  currentStep: number
  status: string
  stepData: StepData[]
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

  // Update status to UNDER_REVIEW when component mounts
  useEffect(() => {
    async function updateStatusAndFetchData() {
      if (!surveyId) return
      
      try {
        // Update the status to UNDER_REVIEW
        await fetch(`/api/survey/${surveyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: 13,
            status: 'UNDER_REVIEW'
          })
        })
        
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

    updateStatusAndFetchData()
  }, [surveyId])

  // Helper function to check if a step is completed
  const isStepCompleted = (stepId: number): boolean => {
    if (backendSurveyData?.stepData) {
      const step = backendSurveyData.stepData.find(s => s.step_id === stepId.toString())
      return !!step
    }
    return false
  }

  // Helper function to check if a step was skipped
  const isStepSkipped = (stepId: number): boolean => {
    if (backendSurveyData?.stepData) {
      const step = backendSurveyData.stepData.find(s => s.step_id === stepId.toString())
      return !!step && (step.photo_type === 'skipped' || step.analysis_result.ai_feedback === 'Step skipped by user')
    }
    return false
  }

  // Helper function to get step data
  const getStepData = (stepId: number): StepData | null => {
    if (backendSurveyData?.stepData) {
      return backendSurveyData.stepData.find(s => s.step_id === stepId.toString()) || null
    }
    return null
  }

  // Helper function to get entered value for a step
  const getEnteredValue = (stepId: number): string | null => {
    const stepData = getStepData(stepId)
    return stepData?.analysis_result.extracted_value || null
  }

  const getStructuredData = (stepId: number): Record<string, string> | null => {
    const stepData = getStepData(stepId)
    if (stepData?.analysis_result?.structured_data) {
      return stepData.analysis_result.structured_data as Record<string, string>
    }
    return null
  }

  const handleFinishSurvey = async () => {
    try {
      // Complete the survey in the backend
      const success = await completeSurvey({
        finalData: {
          totalSteps: CAMERA_STEPS.length,
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

  // Don't show loading state - proceed immediately
  if (isLoadingSurvey && !backendSurveyData) {
    // Still loading initial data, just show empty state
    return null
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
                {CAMERA_STEPS.map((step) => {
                  const stepCompleted = isStepCompleted(step.id)
                  const stepSkipped = isStepSkipped(step.id)
                  const data = getStepData(step.id)
                  
                  // Find the image URL for this step - match the actual S3 key format
                  const stepImageKey = Object.keys(imageUrls).find(key => 
                    key.includes(`/step_${step.id}.jpg`) || key.endsWith(`step_${step.id}.jpg`)
                  )
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
                            {stepSkipped && (
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
                          {/* Show skip message for skipped steps */}
                          {stepSkipped && (
                            <div className="mb-4 p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">(skipped)</p>
                            </div>
                          )}

                          {/* Data Entry Display */}
                          {step.stepType === 'data-entry' && !stepSkipped && (
                            <div className="mb-4 p-4 bg-muted rounded-lg">
                              <p className="text-lg font-semibold">
                                Entered Value: {getEnteredValue(step.id) || 'No value'}
                              </p>
                              {data?.analysis_result.ai_feedback && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {data.analysis_result.ai_feedback}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Extracted Value Display for camera steps */}
                          {step.stepType === 'camera' && !stepSkipped && getEnteredValue(step.id) && (
                            <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                Extracted Value: <span className="font-mono font-bold">{getEnteredValue(step.id)}</span>
                              </p>
                            </div>
                          )}

                          {/* Structured Data Display */}
                          {!stepSkipped && (() => {
                            const structuredData = getStructuredData(step.id)
                            // Filter out empty values for display only
                            const nonEmptyData = structuredData ? Object.fromEntries(
                              Object.entries(structuredData).filter(([, value]) => value && value.trim() !== '')
                            ) : {}
                            
                            return Object.keys(nonEmptyData).length > 0 ? (
                              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
                                  Extracted Label Information:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {Object.entries(nonEmptyData).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                      </span>
                                      <span className="text-sm font-mono text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                                        {value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          })()}

                          {/* Image Preview */}
                          {data?.s3_info && !stepSkipped && step.stepType !== 'data-entry' && (
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
                                  onError={() => console.error(`Image failed to load for step ${step.id}`)}
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

                          {/* For skipped camera steps, show option to take photo */}
                          {stepSkipped && step.stepType === 'camera' && (
                            <Button
                              onClick={() => handleRetakePhoto(step.id)}
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Take Photo
                            </Button>
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