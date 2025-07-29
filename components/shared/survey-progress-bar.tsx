'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import { surveyProgressAtom } from '@/atoms/survey'

export function SurveyProgressBar() {
  const progress = useAtomValue(surveyProgressAtom)

  // Only show progress bar during actual survey steps
  if (!progress.isStep) {
    return null
  }

  return (
    <div className="bg-card px-6 py-2 border-b border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">
          Step {progress.current} of {progress.total}
        </span>
        <span className="text-xs text-muted-foreground">
          {progress.percentage}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div 
          className="bg-primary h-1 rounded-full transition-all duration-300" 
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
    </div>
  )
} 