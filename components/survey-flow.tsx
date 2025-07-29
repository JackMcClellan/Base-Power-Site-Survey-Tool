'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import { currentStepAtom, surveyStepsAtom } from '@/atoms/survey'
import { WelcomeStep } from '@/components/steps/welcome-step'
import { CameraStep } from '@/components/steps/camera-step'
import { ReviewStep } from '@/components/steps/review-step'

export function SurveyFlow() {
  const currentStepId = useAtomValue(currentStepAtom)
  const surveySteps = useAtomValue(surveyStepsAtom)
  
  // Flow logic:
  // Step 0: Welcome page (pre-survey intro)
  // Steps 1-5: Camera steps (actual survey steps from survey-steps.ts)  
  // Step 6+: Review page (post-survey review)
  
  if (currentStepId === 0) {
    return <WelcomeStep />
  }
  
  // Check if this is a camera step (within the survey steps range)
  if (currentStepId >= 1 && currentStepId <= surveySteps.length) {
    return <CameraStep />
  }
  
  // After all camera steps, show review
  if (currentStepId > surveySteps.length) {
    return <ReviewStep />
  }
  
  // Default fallback
  return <WelcomeStep />
} 