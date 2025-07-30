'use client'

import React from 'react'
import { useSetAtom, useAtomValue } from 'jotai'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SurveyHeader } from '@/components/shared/survey-header'
import { nextStepAtom, currentStepAtom } from '@/atoms/survey'
import { SURVEY_STEPS } from '@/config/survey-steps'
import { useSurveyBackend } from '@/hooks/use-survey-backend'

interface GuideStepProps {
  title: string
  description: string
  instructions: string[]
  buttonText: string
  tip?: string
}

export function GuideStep({ title, description, instructions, buttonText, tip }: GuideStepProps) {
  const nextStep = useSetAtom(nextStepAtom)
  const currentStepId = useAtomValue(currentStepAtom)
  const { updateCurrentStep } = useSurveyBackend()

  const handleContinue = async () => {
    // Find what the next step will be
    const stepSequence = SURVEY_STEPS
      .map(step => step.id)
      .sort((a, b) => a - b)
    
    const currentIndex = stepSequence.indexOf(currentStepId)
    const nextStepId = currentIndex >= 0 && currentIndex < stepSequence.length - 1 
      ? stepSequence[currentIndex + 1]
      : null
    
    // If the next step is a camera or data-entry step, update the backend
    if (nextStepId) {
      const nextStepData = SURVEY_STEPS.find(step => step.id === nextStepId)
      if (nextStepData && nextStepData.stepType !== 'guide') {
        await updateCurrentStep({ step: nextStepId })
      }
    }
    
    // Move to next step
    nextStep()
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <SurveyHeader showStepNumber={false} />

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Guide Card */}
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
                  {title}
                </h1>
              </div>
              
              {/* Instructions */}
              <div className="text-left space-y-4 mb-8">
                <p className="text-lg text-muted-foreground">
                  {description}
                </p>
                {instructions.map((instruction, index) => (
                  <p 
                    key={index} 
                    className="text-lg text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: instruction }}
                  />
                ))}
                {tip && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-base text-muted-foreground">
                      <strong>Tip:</strong> {tip}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action Button */}
              <div>
                <Button 
                  onClick={handleContinue}
                  variant="default"
                  size="lg"
                  className="w-full font-semibold py-4 text-lg"
                >
                  {buttonText}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 