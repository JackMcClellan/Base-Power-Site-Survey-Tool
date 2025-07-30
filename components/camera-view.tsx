'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { useCamera } from '@/hooks/use-camera'
import { cameraDimensionsAtom } from '@/atoms/camera'
import { CameraMessage } from '@/components/camera-message'
import { CameraHttpsWarning } from '@/components/camera-https-warning'

interface CameraViewProps {
  onCameraReady?: (videoElement: HTMLVideoElement) => void
  className?: string
}

export function CameraView({ onCameraReady, className = '' }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isInitialized = useRef(false)

  const { cameraStream, isCameraAvailable, cameraStatus, requestCameraAccess } = useCamera()
  const [, setDimensions] = useAtom(cameraDimensionsAtom)

  /**
   * Adjusts video size on window resize to maintain responsiveness.
   */
  const handleResize = useCallback(() => {
    const videoElement = videoRef.current

    if (videoElement) {
      const videoRect = videoElement.getBoundingClientRect()
      
      // Update dimensions in state
      setDimensions({ width: videoRect.width, height: videoRect.height })
    }
  }, [setDimensions])

  // Handle camera stream setup
  useEffect(() => {
    if (cameraStream && videoRef.current && !isInitialized.current) {
      const videoElement = videoRef.current
      
      // Set the video source to the camera stream
      if (videoElement.srcObject !== cameraStream) {
        videoElement.srcObject = cameraStream
        
        // Initialize dimensions once video metadata is loaded
        videoElement.onloadedmetadata = () => {
          const videoRect = videoElement.getBoundingClientRect()
          setDimensions({ width: videoRect.width, height: videoRect.height })
          
          // Call the onCameraReady callback if provided
          if (onCameraReady) {
            onCameraReady(videoElement)
          }
          
          // Mark as initialized to prevent re-running
          isInitialized.current = true
        }
      }
    }
  }, [cameraStream, onCameraReady, setDimensions])

  // Effect for handling window resize events
  useEffect(() => {
    window.addEventListener('resize', handleResize)

    // Cleanup resize listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [handleResize])

  // Auto-request camera access when component mounts
  useEffect(() => {
    if (!isCameraAvailable) {
      // Add a small delay for mobile devices to ensure proper initialization
      const timer = setTimeout(() => {
        requestCameraAccess()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isCameraAvailable, requestCameraAccess])

  // Show HTTPS warning if camera access failed due to protocol issues
  if (cameraStatus === 'error' && typeof window !== 'undefined' && 
      window.location.protocol !== 'https:' && 
      window.location.hostname !== 'localhost' && 
      window.location.hostname !== '127.0.0.1') {
    return <CameraHttpsWarning onRetry={requestCameraAccess} />
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-background ${className}`}>
      {/* Video element to display camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-10"
        style={{
          // Ensure proper mobile video rendering
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
        }}
      />

      {/* Message dialog for user feedback */}
      <CameraMessage />
    </div>
  )
} 