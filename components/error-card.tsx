'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SurveyHeader } from '@/components/shared/survey-header'

interface ErrorCardProps {
  title?: string
  message?: string
}

export function ErrorCard({ 
  title = "Survey Link Not Found",
  message = "The survey link you're looking for doesn't exist or has expired. Please check your link or contact support if you believe this is an error."
}: ErrorCardProps) {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <SurveyHeader showStepNumber={false} />

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Error Card */}
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
                <h1 className="text-3xl font-bold text-foreground">
                  {title}
                </h1>
              </div>
              
              {/* Subtitle */}
              <p className="text-lg text-muted-foreground mb-8">
                {message}
              </p>
              
              {/* Help text */}
              <p className="text-sm text-muted-foreground">
                Need help? Please contact support with your survey link.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 