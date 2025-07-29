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

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
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
                <div className="text-left">
                  <div className="text-2xl font-bold text-foreground">
                    {actualSurveySteps.length} <span className="text-lg font-normal">steps</span>
                  </div>
                  <div className="text-sm text-muted-foreground">+ AI-powered analysis</div>
                </div>
                
                <div className="text-left">
                  <div className="text-4xl font-bold text-secondary">
                    5-10 min
                  </div>
                  <div className="text-sm text-muted-foreground">+ Professional results</div>
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

          {/* Survey Steps Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Survey Steps ({actualSurveySteps.length} total)</CardTitle>
              <CardDescription>
                Here&apos;s what we&apos;ll analyze together:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actualSurveySteps.map((step, index) => {
                  const stepNumber = index + 1
                  const isCompleted = surveyData.completedSteps.includes(step.id)
                  
                  return (
                    <div 
                      key={step.id} 
                      className={`flex items-start space-x-4 p-4 rounded-lg ${
                        isCompleted 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-card border border-border'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        isCompleted
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-muted text-muted-foreground border-2 border-border'
                      }`}>
                        {isCompleted ? 'Done' : stepNumber}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant="default"
                          className="text-xs"
                        >
                          Camera
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>


        </div>
      </div>


    </div>
  )
} 