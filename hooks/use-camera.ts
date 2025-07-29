import { useCallback, useRef } from 'react'
import { useAtom, useSetAtom, useAtomValue } from 'jotai'
import {
  cameraStreamAtom,
  cameraStatusAtom,
  setCameraStreamAtom,
  showCameraMessageAtom,
  isCameraAvailableAtom
} from '@/atoms/camera'

export function useCamera() {
  const [cameraStatus, setCameraStatus] = useAtom(cameraStatusAtom)
  const setCameraStream = useSetAtom(setCameraStreamAtom)
  const showMessage = useSetAtom(showCameraMessageAtom)
  const isCameraAvailable = useAtomValue(isCameraAvailableAtom)
  const cameraStream = useAtomValue(cameraStreamAtom)
  
  // Use ref to track if request is in progress
  const isRequestingRef = useRef(false)

  const requestCameraAccess = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isRequestingRef.current || cameraStatus === 'granted') return
    
    isRequestingRef.current = true
    setCameraStatus('requesting')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Prefer back camera for site surveys
        } 
      })
      
      setCameraStream(stream)
    } catch (err) {
      console.error("Error accessing camera: ", err)
      
      setCameraStatus('error')
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          showMessage("Camera access denied. Please allow camera access in your browser settings.")
          setCameraStatus('denied')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          showMessage("No camera found. Please ensure a camera is connected and enabled.")
        } else {
          showMessage(`Error accessing camera: ${err.message}`)
        }
      } else {
        showMessage("Unknown error accessing camera")
      }
    } finally {
      isRequestingRef.current = false
    }
  }, [setCameraStatus, setCameraStream, showMessage, cameraStatus])

  const stopCamera = useCallback(() => {
    setCameraStream(null)
    setCameraStatus('idle')
  }, [setCameraStream, setCameraStatus])

  return {
    cameraStream,
    cameraStatus,
    isCameraAvailable,
    requestCameraAccess,
    stopCamera,
  }
} 