'use client'

import { useCallback } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { surveyIdAtom, setSyncingAtom } from '@/atoms/survey'

interface UploadImageOptions {
  file: File
  stepId: number
  imageType: 'meter_photo' | 'analysis_result'
}

interface UpdateStepOptions {
  step: number
  stepData?: Record<string, unknown>
}

interface CompleteSurveyOptions {
  finalData?: Record<string, unknown>
  completionNotes?: string
}

export function useSurveyBackend() {
  const surveyId = useAtomValue(surveyIdAtom)
  const setSyncing = useSetAtom(setSyncingAtom)

  // Update current step in the database
  const updateCurrentStep = useCallback(async ({ step, stepData }: UpdateStepOptions) => {
    if (!surveyId) {
      console.error('No survey ID available')
      return false
    }

    setSyncing(true)
    try {
      const response = await fetch(`/api/survey/${surveyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step,
          stepData: stepData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update step: ${response.status}`)
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error updating step:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [surveyId, setSyncing])

  // Upload image to S3 using presigned URL
  const uploadImage = useCallback(async ({ file, stepId, imageType }: UploadImageOptions) => {
    if (!surveyId) {
      console.error('No survey ID available')
      return null
    }

    console.log('Starting image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      stepId,
      surveyId
    })

    try {
      // Step 1: Get presigned upload URL
      const presignedResponse = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: surveyId,
          stepId: stepId,
          fileName: `step-${stepId}-${imageType}-${Date.now()}.jpg`,
          contentType: file.type,
        }),
      })

      if (!presignedResponse.ok) {
        const errorText = await presignedResponse.text()
        console.error('Presigned URL error response:', errorText)
        throw new Error(`Failed to get upload URL: ${presignedResponse.status}`)
      }

      const presignedResult = await presignedResponse.json()
      console.log('Presigned URL response:', presignedResult)
      
      if (!presignedResult.success || !presignedResult.data) {
        throw new Error('Invalid presigned URL response')
      }

      const { uploadUrl, key } = presignedResult.data
      console.log('Got presigned URL, uploading to S3...')

      // Step 2: Upload directly to S3
      console.log('Uploading to S3 URL:', uploadUrl.substring(0, 50) + '...')
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'Content-Length': file.size.toString(),
        },
      })

      console.log('S3 upload response:', {
        status: uploadResponse.status,
        ok: uploadResponse.ok
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('S3 upload error:', errorText)
        throw new Error(`Failed to upload to S3: ${uploadResponse.status}`)
      }

      console.log('Successfully uploaded to S3, updating survey...')

      // Step 3: Update survey with file reference
      const updateData: Record<string, unknown> = {}
      if (imageType === 'meter_photo') {
        updateData.meterPhotos = {
          [`step_${stepId}`]: {
            fileName: key,
            uploadedAt: new Date().toISOString(),
          },
        }
      } else {
        updateData.analysisResults = {
          [`step_${stepId}`]: {
            fileName: key,
            uploadedAt: new Date().toISOString(),
          },
        }
      }

      await fetch(`/api/survey/${surveyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meterPhotos: updateData.meterPhotos,
          analysisResults: updateData.analysisResults 
        }),
      })

      console.log('Upload complete, saved to database')
      return key
    } catch (error) {
      console.error('Error uploading image:', error)
      console.error('Full error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        surveyId,
        stepId,
        fileName: file.name,
      })
      
      // Throw the error so the caller knows what went wrong
      throw error
    }
  }, [surveyId])

  // Complete the survey
  const completeSurvey = useCallback(async (options?: CompleteSurveyOptions) => {
    if (!surveyId) {
      console.error('No survey ID available')
      return false
    }

    setSyncing(true)
    try {
      console.log('Completing survey with options:', options)
      console.log('Survey ID:', surveyId)
      
      const response = await fetch(`/api/survey/${surveyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalData: options?.finalData,
          completionNotes: options?.completionNotes,
        }),
      })

      console.log('Complete survey response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Complete survey error response:', errorText)
        throw new Error(`Failed to complete survey: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Complete survey result:', result)
      return result.success
    } catch (error) {
      console.error('Error completing survey:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [surveyId, setSyncing])

  // Save survey data (general purpose)
  const saveSurveyData = useCallback(async (data: Record<string, unknown>) => {
    if (!surveyId) {
      console.error('No survey ID available')
      return false
    }

    setSyncing(true)
    try {
      const response = await fetch(`/api/survey/${surveyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyData: data }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save survey data: ${response.status}`)
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Error saving survey data:', error)
      return false
    } finally {
      setSyncing(false)
    }
  }, [surveyId, setSyncing])

  return {
    updateCurrentStep,
    uploadImage,
    completeSurvey,
    saveSurveyData,
    surveyId,
  }
} 