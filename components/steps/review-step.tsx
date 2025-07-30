'use client'

import React, { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { surveyDataAtom, surveyStepsAtom, currentStepAtom } from '@/atoms/survey'
import { SurveyHeader } from '@/components/shared/survey-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function ReviewStep() {
  const surveyData = useAtomValue(surveyDataAtom)
  const steps = useAtomValue(surveyStepsAtom)
  const setCurrentStep = useSetAtom(currentStepAtom)
  const [showThankYou, setShowThankYou] = useState(false)
  
  // All steps in the configuration are now camera steps
  const completedSteps = surveyData.completedSteps
  const stepData = surveyData.stepData

  const handleFinishSurvey = async () => {
    // TODO: Send survey data to server
    // For now, just show thank you page
    console.log('Sending survey data to server:', surveyData)
    setShowThankYou(true)
  }

  const handleRetakePhoto = (stepId: number) => {
    // Navigate back to the specific step
    setCurrentStep(stepId)
  }

  // Show thank you page if survey is finished
  if (showThankYou) {
    return (
      <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
        <SurveyHeader showStepNumber={false} />
        
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary-foreground">Thank You!</CardTitle>
              <CardDescription className="text-lg mt-4">
                Your electricity meter survey has been successfully submitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">
                We&apos;ll review your information and contact you soon with next steps for your battery system installation.
              </p>
              <div className="mt-8">
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="lg"
                >
                  Start New Survey
                </Button>
              </div>
            </CardContent>
          </Card>
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
                {completedSteps.map((stepId) => {
                  const step = steps.find(s => s.id === stepId)
                  const data = stepData[stepId]
                  
                  if (!step || !data) return null

                  return (
                    <div key={stepId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              Step {stepId}
                            </Badge>
                            <span>{step.title}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>

                      {/* Data Entry Display */}
                      {step.stepType === 'data-entry' && data.data?.amperage && (
                        <div className="mb-4 p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Main Disconnect Amperage</p>
                              <p className="text-2xl font-bold">{data.data.amperage}A</p>
                            </div>
                            {data.data.extractedValue && (
                              <Badge variant="secondary" className="ml-2">
                                AI Detected
                              </Badge>
                            )}
                          </div>
                          {data.action === 'skip' && (
                            <p className="text-sm text-muted-foreground mt-2">No value entered</p>
                          )}
                        </div>
                      )}

                      {/* Image Preview - Don't show for data entry steps unless they have their own image */}
                      {data.imageData && step.stepType !== 'data-entry' && (
                        <div className="space-y-3">
                          <img 
                            src={data.imageData} 
                            alt={`Survey step ${stepId}`}
                            className="w-full max-w-md rounded-lg border"
                          />
                          <Button
                            onClick={() => handleRetakePhoto(stepId)}
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
                          onClick={() => handleRetakePhoto(stepId)}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Edit Value
                        </Button>
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
          >
            Finish Survey
          </Button>
        </div>
      </div>
    </div>
  )
} 