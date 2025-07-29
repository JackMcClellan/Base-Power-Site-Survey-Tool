'use client'

import React, { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { surveyDataAtom, surveyStepsAtom, currentStepAtom } from '@/atoms/survey'
import { SurveyHeader } from '@/components/shared/survey-header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Step3Review() {
  const surveyData = useAtomValue(surveyDataAtom)
  const steps = useAtomValue(surveyStepsAtom)
  const setCurrentStep = useSetAtom(currentStepAtom)
  const [showThankYou, setShowThankYou] = useState(false)
  
  const actualSteps = steps.filter(step => step.isStep)
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
              <CardTitle className="text-2xl text-primary">Electricity Meter Survey Complete!</CardTitle>
              <CardDescription>
                Your electricity meter assessment has been completed. Here&apos;s a comprehensive summary of your electrical installation analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{completedSteps.length}</div>
                  <div className="text-sm text-muted-foreground">Steps Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{Object.keys(stepData).length}</div>
                  <div className="text-sm text-muted-foreground">Photos Captured</div>
                </div>
              </div>
            </CardContent>
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
                              Step {actualSteps.findIndex(s => s.id === stepId) + 1}
                            </Badge>
                            <span>{step.title}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {data.imageData && (
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