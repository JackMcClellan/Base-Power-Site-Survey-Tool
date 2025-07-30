'use client'

import React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SurveyHeader } from '@/components/shared/survey-header'
import { 
  surveyStepsAtom, 
  nextStepAtom, 
  startSurveyAtom,
  surveyDataAtom 
} from '@/atoms/survey'
import { useSurveyBackend } from '@/hooks/use-survey-backend'

export function WelcomeStep() {
  const steps = useAtomValue(surveyStepsAtom)
  const surveyData = useAtomValue(surveyDataAtom)
  const nextStep = useSetAtom(nextStepAtom)
  const startSurvey = useSetAtom(startSurveyAtom)
  const { updateCurrentStep } = useSurveyBackend()

  // All steps in the configuration are now camera steps
  const actualSurveySteps = steps

  const handleStart = async () => {
    if (!surveyData.startTime) {
      // Start the survey
      startSurvey()
      // Update backend to step 1
      await updateCurrentStep({ step: 1 })
    } else {
      // If survey was already started, just move to next step
      nextStep()
      // Update backend with the new step (which would be 1 if coming from 0)
      await updateCurrentStep({ step: 1 })
    }
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <SurveyHeader showStepNumber={false} />

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Welcome Card */}
          <Card className="text-center">
            <CardContent className="p-8">
              {/* BASE Badge */}
              <div className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold text-sm mb-6">
                BASE
              </div>
              
              {/* Main Title */}
              <div className="mb-4">
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Electricity Meter
                </h1>
                <h1 className="text-4xl font-bold text-foreground">
                  Survey
                </h1>
              </div>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-8">
                AI-powered site assessment for battery system installation.
              </p>
              
              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#292826' }}>
                    {actualSurveySteps.length} <span className="text-lg font-normal">steps</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold" style={{ color: '#292826' }}>
                    10-15 min
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div>
                <Button 
                  onClick={handleStart}
                  variant="default"
                  size="lg"
                  className="w-full font-semibold py-4 text-lg"
                  disabled={surveyData.currentlySyncing}
                >
                  {surveyData.currentlySyncing 
                    ? 'Starting...' 
                    : surveyData.startTime 
                      ? 'Continue Survey' 
                      : 'Start Assessment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 