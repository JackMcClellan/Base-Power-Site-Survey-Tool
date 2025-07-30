'use client'

import React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SurveyHeader } from '@/components/shared/survey-header'
import { 
  surveyStepsAtom, 
  nextStepAtom, 
  startSurveyAtom,
  surveyDataAtom 
} from '@/atoms/survey'

export function WelcomeStep() {
  const steps = useAtomValue(surveyStepsAtom)
  const surveyData = useAtomValue(surveyDataAtom)
  const nextStep = useSetAtom(nextStepAtom)
  const startSurvey = useSetAtom(startSurveyAtom)

  // All steps in the configuration are now camera steps
  const actualSurveySteps = steps

  const handleStart = () => {
    if (!surveyData.startTime) {
      startSurvey()
    } else {
      // If survey was already started, just move to first step
      nextStep()
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
                >
                  {surveyData.startTime ? 'Continue Survey' : 'Start Assessment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 