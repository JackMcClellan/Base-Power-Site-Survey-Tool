'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error'

export interface UseCameraReturn {
  cameraStream: MediaStream | null
  isCameraAvailable: boolean
  cameraStatus: CameraStatus
  requestCameraAccess: () => Promise<void>
  error: string | null
}

export function useCamera(): UseCameraReturn {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const requestCameraAccess = useCallback(async () => {
    if (cameraStatus === 'requesting') return
    
    setCameraStatus('requesting')
    setError(null)

    try {
      // Request camera access with optimal settings for photo capture
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false
      })

      // Clean up previous stream if exists
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      streamRef.current = stream
      setCameraStream(stream)
      setCameraStatus('granted')
    } catch (err) {
      console.error('Camera access failed:', err)
      
      let errorMessage = 'Camera access failed'
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.'
          setCameraStatus('denied')
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.'
          setCameraStatus('error')
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application.'
          setCameraStatus('error')
        } else {
          errorMessage = err.message
          setCameraStatus('error')
        }
      } else {
        setCameraStatus('error')
      }
      
      setError(errorMessage)
      setCameraStream(null)
      streamRef.current = null
    }
  }, [cameraStatus])

  // Check if camera is available
  const isCameraAvailable = cameraStream !== null && cameraStatus === 'granted'

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Check if getUserMedia is supported
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser')
      setCameraStatus('error')
    }
  }, [])

  return {
    cameraStream,
    isCameraAvailable,
    cameraStatus,
    requestCameraAccess,
    error
  }
} 