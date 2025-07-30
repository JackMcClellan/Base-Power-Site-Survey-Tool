'use client'

import React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SurveyHeader } from '@/components/shared/survey-header'
import { 
  nextStepAtom, 
  startSurveyAtom,
  surveyDataAtom 
} from '@/atoms/survey'
import { useSurveyBackend } from '@/hooks/use-survey-backend'

export function WelcomeStep() {
  const surveyData = useAtomValue(surveyDataAtom)
  const nextStep = useSetAtom(nextStepAtom)
  const startSurvey = useSetAtom(startSurveyAtom)
  const { updateCurrentStep } = useSurveyBackend()


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
              <div className="flex justify-center mb-6">
                <img 
                  src="/base.svg" 
                  alt="BASE" 
                  className="h-12" 
                  style={{ filter: 'brightness(0) saturate(100%) invert(15%) sepia(8%) saturate(1071%) hue-rotate(15deg) brightness(94%) contrast(95%)' }}
                />
              </div>
              
              {/* Main Title */}
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                Home Energy Site
                </h1>
                <h1 className="text-3xl font-bold text-foreground">
                  Survey
                </h1>
              </div>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-8">
              This form will help you take photos so we can see if your home meets Base&apos;s space and electrical requirements. 
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                For the best experience, please use your phone to complete the survey.
              </p>
              {/* Action Button */}
              <div>
                <Button 
                  onClick={handleStart}
                  variant="default"
                  size="lg"
                  className="w-full font-semibold py-4 text-lg"
                  disabled={surveyData.currentlySyncing}
                >
                      Start Survey
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 