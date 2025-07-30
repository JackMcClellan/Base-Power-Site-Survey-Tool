'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import { currentStepAtom, surveyDataAtom, surveyIdAtom } from '@/atoms/survey'
import { SurveyFlow } from '@/components/survey-flow'
import { ThankYou } from '@/components/thank-you'

export default function SurveyPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [, setCurrentStep] = useAtom(currentStepAtom)
  const setSurveyData = useSetAtom(surveyDataAtom)
  const setSurveyId = useSetAtom(surveyIdAtom)

  useEffect(() => {
    async function initializeSurvey() {
      try {
        setIsLoading(true)

        // Basic UUID validation - just check it looks like a UUID
        const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
        if (!uuid || !uuidPattern.test(uuid)) {
          router.replace('/')
          return
        }

        // Set survey ID in atom for other components to use
        setSurveyId(uuid)

        // Fetch survey data from backend - this will create it if it doesn't exist
        const response = await fetch(`/api/survey/${uuid}`)
        
        if (!response.ok) {
          console.error('Failed to fetch/create survey:', response.status)
          // Don't redirect - let the user see an error instead
          setIsLoading(false)
          return
        }

        const result = await response.json()
        
        if (!result.success) {
          console.error('Survey API returned unsuccessful:', result)
          setIsLoading(false)
          return
        }

        const surveyData = result.data

        // Check if survey is already completed
        if (surveyData.status === 'COMPLETED') {
          setIsCompleted(true)
          setIsLoading(false)
          return
        }

        // Update local state with backend data
        setCurrentStep(surveyData.currentStep || 0)
        
        // Initialize survey data atom with backend data
        setSurveyData({
          stepData: {},
          startTime: surveyData.createdAt ? new Date(surveyData.createdAt) : new Date(),
          completedSteps: [],
          surveyId: uuid,
          currentlySyncing: false
        })

      } catch (err) {
        console.error('Error initializing survey:', err)
        // Don't redirect on errors - survey should still work
      } finally {
        setIsLoading(false)
      }
    }

    initializeSurvey()
  }, [uuid, setCurrentStep, setSurveyData, setSurveyId, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your survey...</p>
        </div>
      </div>
    )
  }

  // Show thank you page if survey is completed
  if (isCompleted) {
    return <ThankYou />
  }

  // Render survey flow (even if there were backend errors)
  return <SurveyFlow />
} 