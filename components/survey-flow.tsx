'use client'

import { useAtomValue } from 'jotai'
import { currentStepAtom } from '@/atoms/survey'
import { SURVEY_STEPS } from '@/config/survey-steps'
import { WelcomeStep } from '@/components/steps/welcome-step'
import { CameraStep } from '@/components/steps/camera-step'
import { ReviewStep } from '@/components/steps/review-step'
import { GuideStep } from '@/components/steps/guide-step'

export function SurveyFlow() {
  const currentStepId = useAtomValue(currentStepAtom)
  
  // Flow logic:
  // Step 0: Welcome page (pre-survey intro)
  // Step 0.5: Meter area guide
  // Steps 1-6: Camera steps for meter area
  // Step 6.5: A/C area guide  
  // Steps 7-8: Camera steps for A/C units
  // Step 8.5: Electrical panel guide
  // Steps 9-12: Camera/data-entry steps for electrical panel
  // Step 13: Review page (post-survey review)
  
  if (currentStepId === 0) {
    return <WelcomeStep />
  }
  
  // Find the current step in SURVEY_STEPS
  const currentStep = SURVEY_STEPS.find(step => step.id === currentStepId)
  
  // Check if this is a guide step
  if (currentStep?.stepType === 'guide' && currentStep.guideConfig) {
    return (
      <GuideStep
        title={currentStep.title}
        description={currentStep.guideConfig.mainDescription}
        instructions={currentStep.guideConfig.instructionsParagraphs}
        buttonText={currentStep.guideConfig.buttonText}
        tip={currentStep.guideConfig.tip}
      />
    )
  }
  
  // Check if this is a camera or data-entry step
  if (currentStep && (currentStep.stepType === 'camera' || currentStep.stepType === 'data-entry' || !currentStep.stepType)) {
    return <CameraStep />
  }
  
  // Show review step when currentStepId is 13
  if (currentStepId === 13) {
    return <ReviewStep />
  }
  
  // If we couldn't find the step and it's not a special case, show welcome as fallback
  return <WelcomeStep />
} 