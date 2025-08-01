'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import { currentStepAtom, surveyDataAtom, surveyIdAtom } from '@/atoms/survey'
import { SurveyFlow } from '@/components/survey-flow'
import { ThankYou } from '@/components/thank-you'
import { SURVEY_STEPS } from '@/config/survey-steps'

export default function SurveyPage() {
  const params = useParams()
  const router = useRouter()
  const uuid = params.uuid as string
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)
  const [currentStep, setCurrentStep] = useAtom(currentStepAtom)
  const setSurveyData = useSetAtom(surveyDataAtom)
  const setSurveyId = useSetAtom(surveyIdAtom)
  const hasInitialized = useRef(false)

  useEffect(() => {
    async function initializeSurvey() {
      // Prevent double initialization
      if (hasInitialized.current) return
      hasInitialized.current = true
      
      try {
        // Basic UUID validation - just check it looks like a UUID
        const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
        if (!uuid || !uuidPattern.test(uuid)) {
          router.replace('/')
          return
        }

        // Set survey ID in atom for other components to use
        setSurveyId(uuid)

        // Only fetch and update from backend if we're still at step 0
        // This prevents overriding user navigation
        if (currentStep !== 0) {
          setIsLoading(false)
          return
        }

        // Fetch survey data from backend - this will create it if it doesn't exist
        const response = await fetch(`/api/survey/${uuid}`)
        
        if (!response.ok) {
          console.error('Failed to fetch/create survey:', response.status)
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

        // If survey is under review, always go to step 13 (review step)
        if (surveyData.status === 'UNDER_REVIEW') {
          setCurrentStep(13)
        } else if (currentStep === 0 && surveyData.currentStep && surveyData.currentStep > 0) {
          // Only update step if we're still at welcome (step 0) and backend has progress
          const backendStep = surveyData.currentStep
          
          // Get all valid step IDs including guides and special steps, and review step (13)
          const validStepIds = [0, ...SURVEY_STEPS.map(step => step.id), 13]
          
          // Only set the step if it's valid
          if (validStepIds.includes(backendStep)) {
            setCurrentStep(backendStep)
          }
        }
        
        // Initialize survey data atom with backend data
        setSurveyData({
          stepData: {},
          startTime: surveyData.createdAt ? new Date(surveyData.createdAt) : null,
          completedSteps: [],
          surveyId: uuid,
          currentlySyncing: false
        })

      } catch (err) {
        console.error('Error initializing survey:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeSurvey()
  }, [uuid]) // Only depend on uuid, not on state that might change

  // Don't render anything while initializing
  if (isLoading) {
    return null
  }

  // Show thank you page if survey is completed
  if (isCompleted) {
    return <ThankYou />
  }

  // Render survey flow
  return <SurveyFlow />
} 