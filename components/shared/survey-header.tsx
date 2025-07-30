'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import { Badge } from '@/components/ui/badge'
import { surveyProgressAtom } from '@/atoms/survey'

interface SurveyHeaderProps {
  showStepNumber?: boolean
}

export function SurveyHeader({ showStepNumber = true }: SurveyHeaderProps) {
  const progress = useAtomValue(surveyProgressAtom)

  return (
    <header 
      className="bg-card text-foreground border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
              <img 
                  src="/base.svg" 
                  alt="BASE" 
                  className="h-8" 
                  style={{ filter: 'brightness(0) saturate(100%) invert(15%) sepia(8%) saturate(1071%) hue-rotate(15deg) brightness(94%) contrast(95%)' }}
                />
            <h1 className="text-xl font-semibold hidden sm:block">
              Home Energy Site Survey
            </h1>
          </div>
          
          {/* Step Number */}
          {showStepNumber && (
            <Badge variant="secondary">
              Step {progress.current} of {progress.total}
            </Badge>
          )}
        </div>
      </div>
    </header>
  )
} 