'use client'

import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { useCamera } from '@/hooks/use-camera'
import { cameraDimensionsAtom } from '@/atoms/camera'
import { CameraMessage } from '@/components/camera-message'

interface AROverlay {
  id: string
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, timestamp: number) => void
}

interface CameraViewProps {
  overlays?: AROverlay[]
  onCameraReady?: (videoElement: HTMLVideoElement) => void
  className?: string
}

export function CameraView({ overlays = [], onCameraReady, className = '' }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number | null>(null)
  const overlaysRef = useRef<AROverlay[]>(overlays)
  const isInitialized = useRef(false)

  const { cameraStream, isCameraAvailable, requestCameraAccess } = useCamera()
  const [dimensions, setDimensions] = useAtom(cameraDimensionsAtom)

  // Update overlays ref when overlays prop changes
  useEffect(() => {
    overlaysRef.current = overlays
  }, [overlays])

  /**
   * The main AR animation loop. This function is called repeatedly
   * to draw overlays on the canvas.
   */
  const animateAR = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear the canvas for the new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Use overlays from ref to avoid recreating this function
    const currentOverlays = overlaysRef.current

    // Default AR elements (can be customized via overlays prop)
    if (currentOverlays.length === 0) {
      const timestamp = Date.now()
      
      // Example 1: A simple rectangle that changes size slightly
      const rectSize = 100 + Math.sin(timestamp * 0.005) * 50 // Dynamic size
      const rectX = (canvas.width / 2) - (rectSize / 2)
      const rectY = (canvas.height / 2) - (rectSize / 2)

      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)' // Red, semi-transparent
      ctx.lineWidth = 4
      ctx.strokeRect(rectX, rectY, rectSize, rectSize)

      // Example 2: Text overlay
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)' // Green, semi-transparent
      ctx.font = '30px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('AR Overlay Active!', canvas.width / 2, canvas.height / 4)

      // Example 3: A circle that moves horizontally
      const circleRadius = 30
      const circleX = (canvas.width / 2) + Math.sin(timestamp * 0.002) * (canvas.width / 4)
      const circleY = canvas.height - 100
      ctx.beginPath()
      ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 0, 255, 0.7)' // Blue, semi-transparent
      ctx.fill()
      ctx.closePath()
    } else {
      // Render custom overlays
      const timestamp = Date.now()
      currentOverlays.forEach(overlay => {
        overlay.render(ctx, canvas, timestamp)
      })
    }

    // Request the next animation frame
    animationFrameId.current = requestAnimationFrame(animateAR)
  }, []) // No dependencies - uses refs instead

  /**
   * Adjusts canvas size on window resize to maintain responsiveness.
   */
  const handleResize = useCallback(() => {
    const videoElement = videoRef.current
    const canvasElement = canvasRef.current

    if (videoElement && canvasElement) {
      // Ensure canvas matches video dimensions for proper overlay
      const videoRect = videoElement.getBoundingClientRect()
      canvasElement.width = videoRect.width
      canvasElement.height = videoRect.height

      // Update dimensions in state
      setDimensions({ width: videoRect.width, height: videoRect.height })
    }
  }, [setDimensions])

  // Initialize camera stream once
  useEffect(() => {
    const videoElement = videoRef.current
    
    if (!videoElement || !cameraStream || isInitialized.current) return

    // Mark as initialized to prevent re-running
    isInitialized.current = true

    // Set the stream only once
    videoElement.srcObject = cameraStream

    const handleLoadedMetadata = () => {
      videoElement.play() // Start playing the video
      handleResize() // Set initial canvas size
      
      // Start animation loop only if not already running
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(animateAR)
      }
      
      // Notify parent component that camera is ready
      if (onCameraReady) {
        onCameraReady(videoElement)
      }
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Cleanup
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [cameraStream, animateAR, handleResize, onCameraReady])

  // Reset initialization flag when stream changes
  useEffect(() => {
    if (!cameraStream) {
      isInitialized.current = false
    }
  }, [cameraStream])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
        animationFrameId.current = null
      }
    }
  }, [])

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
      requestCameraAccess()
    }
  }, []) // Only run once on mount

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-900 ${className}`}>
      {/* Video element to display camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-10"
      />

      {/* Canvas element for AR overlays */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
      />

      {/* Message dialog for user feedback */}
      <CameraMessage />
    </div>
  )
} 