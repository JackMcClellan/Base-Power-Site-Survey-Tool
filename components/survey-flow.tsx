'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import { currentStepDataAtom } from '@/atoms/survey'
import { Step1Welcome } from '@/components/steps/step-1-welcome'
import { Step2ElectricityMeterCloseup } from '@/components/steps/step-2-find-computer'
import { Step3Review } from '@/components/steps/step-3-review'

export function SurveyFlow() {
  const currentStep = useAtomValue(currentStepDataAtom)

  // Render the appropriate component based on step ID
  switch (currentStep.id) {
    case 1:
      return <Step1Welcome />
    case 2:
      return <Step2ElectricityMeterCloseup />
    case 3:
      return <Step3Review />
    default:
      return <Step1Welcome />
  }
} 