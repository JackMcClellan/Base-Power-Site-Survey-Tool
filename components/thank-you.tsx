'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function ThankYou() {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary-foreground">Thank You!</CardTitle>
            <CardDescription className="text-lg mt-4 font-semibold">
              Your electricity meter survey has been recorded.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              We&apos;ll review your information and contact you soon with next steps for your battery system installation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 