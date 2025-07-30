'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface SurveyActionsProps {
  onCapture: () => void
  onSkip?: () => void
  isLastStep?: boolean
  captureLabel?: string
  skipLabel?: string
  isLoading?: boolean
  className?: string
}

export function SurveyActions({ 
  onCapture, 
  onSkip, 
  isLastStep = false,
  captureLabel,
  skipLabel = 'Skip',
  isLoading = false,
  className = ''
}: SurveyActionsProps) {
  const defaultCaptureLabel = isLastStep ? 'Complete Survey' : 'Capture & Continue'
  
  return (
    <div className={`px-6 pb-6 ${className}`}>
      <div className="flex space-x-3">
        {onSkip && (
          <Button 
            onClick={onSkip}
            variant="outline"
            size="lg"
            className="flex-1 py-6 sm:py-4 text-lg"
            disabled={isLoading}
          >
            {skipLabel}
          </Button>
        )}
        <Button 
          onClick={onCapture}
          variant="default"
          size="lg"
          className={`${onSkip ? 'flex-1' : 'w-full'} font-semibold py-6 sm:py-4 text-lg`}
          disabled={isLoading}
        >
          {captureLabel || defaultCaptureLabel}
        </Button>
      </div>
    </div>
  )
} 