'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CameraHttpsWarningProps {
  onRetry?: () => void
}

export function CameraHttpsWarning({ onRetry }: CameraHttpsWarningProps) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  if (isHttps || isLocalhost) {
    return null // Don't show warning if already on HTTPS or localhost
  }

  const httpsUrl = typeof window !== 'undefined' 
    ? window.location.href.replace('http://', 'https://') 
    : ''

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-destructive">HTTPS Required</span>
          </CardTitle>
          <CardDescription>
            Camera access requires a secure connection on mobile devices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-3">
              For security reasons, mobile browsers require HTTPS to access the camera. 
              Please use one of these options:
            </p>
            
            <ul className="space-y-2 list-disc list-inside">
              <li>Access the site via HTTPS</li>
              <li>Use localhost for development</li>
              <li>Contact your administrator for HTTPS setup</li>
            </ul>
          </div>

          <div className="flex flex-col space-y-2">
            {httpsUrl && (
                          <Button 
              onClick={() => window.location.href = httpsUrl}
              variant="default"
              className="w-full"
            >
                Switch to HTTPS
              </Button>
            )}
            
            {onRetry && (
              <Button 
                variant="outline" 
                onClick={onRetry}
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
            <strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 