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

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold text-sm mb-6">
                BASE
              </div>
              
              <div className="text-destructive text-6xl mb-6">⚠️</div>
              
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {title}
                </h1>
              </div>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {message}
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  Need help? Please contact support with your survey link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 