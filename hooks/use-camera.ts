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

    // Check if the required APIs are available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Camera API not available")
      setCameraStatus('error')
      
      // Check if we're on HTTP (not HTTPS) which is required for iOS
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        showMessage("🔒 Camera access requires HTTPS on mobile devices. Please:\n• Use HTTPS (https://)\n• Or access via localhost for development\n• Contact support if you need help setting up HTTPS")
             } else {
         // Try legacy API for older browsers
         const legacyNavigator = navigator as Navigator & {
           getUserMedia?: (
             constraints: MediaStreamConstraints,
             success: (stream: MediaStream) => void,
             error: (error: Error) => void
           ) => void;
           webkitGetUserMedia?: (
             constraints: MediaStreamConstraints,
             success: (stream: MediaStream) => void,
             error: (error: Error) => void
           ) => void;
           mozGetUserMedia?: (
             constraints: MediaStreamConstraints,
             success: (stream: MediaStream) => void,
             error: (error: Error) => void
           ) => void;
         }

         const legacyGetUserMedia = 
           legacyNavigator.getUserMedia || 
           legacyNavigator.webkitGetUserMedia || 
           legacyNavigator.mozGetUserMedia

         if (legacyGetUserMedia) {
           showMessage("Using compatibility mode for camera access...")
           try {
             legacyGetUserMedia.call(navigator,
               { video: true },
               (stream: MediaStream) => {
                 setCameraStream(stream)
                 isRequestingRef.current = false
               },
               (error: Error) => {
                 console.error("Legacy camera access failed:", error)
                 showMessage("Camera access failed. Please check permissions and try again.")
                 setCameraStatus('error')
                 isRequestingRef.current = false
               }
             )
             return
           } catch (legacyError) {
             console.error("Legacy camera API also failed:", legacyError)
           }
         }
       }
      
      // Final fallback message
      showMessage("📱 Camera not available. On iOS:\n• Ensure you're using Safari\n• Check camera permissions in Settings > Safari\n• Make sure the site uses HTTPS")
      
      isRequestingRef.current = false
      return
    }

    // Try progressively less restrictive constraints
    const constraintSets = [
      // Try back camera first (ideal for site surveys)
      { 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        } 
      },
      // Fallback: any camera with preferred resolution
      { 
        video: { 
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      },
      // Last resort: any available camera
      { 
        video: true 
      }
    ]

    let stream: MediaStream | null = null
    let lastError: Error | null = null

         for (const constraints of constraintSets) {
       try {
         stream = await navigator.mediaDevices.getUserMedia(constraints)
         break // Success!
       } catch (err) {
         console.warn("Camera constraint attempt failed:", err)
         lastError = err as Error
         
         // On iOS, sometimes we need to wait a bit between attempts
         if (lastError.name === 'NotReadableError' || lastError.name === 'AbortError') {
           await new Promise(resolve => setTimeout(resolve, 100))
         }
         
         continue // Try next constraint set
       }
     }

    if (stream) {
      setCameraStream(stream)
    } else {
      console.error("All camera access attempts failed. Last error:", lastError)
      setCameraStatus('error')
      
      if (lastError) {
        if (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError') {
          showMessage("Camera access denied. Please allow camera access in your browser settings.")
          setCameraStatus('denied')
        } else if (lastError.name === 'NotFoundError' || lastError.name === 'DevicesNotFoundError') {
          showMessage("No camera found. Please ensure a camera is connected and enabled.")
                 } else if (lastError.name === 'OverconstrainedError') {
           showMessage("Camera constraints not supported. Using basic camera access.")
         } else if (lastError.name === 'NotReadableError') {
           showMessage("Camera is being used by another application. Please close other camera apps and try again.")
         } else if (lastError.name === 'AbortError') {
           showMessage("Camera access was interrupted. Please try again.")
         } else if (lastError.name === 'SecurityError') {
           showMessage("Camera access blocked by security settings. Please check your browser settings.")
         } else {
           showMessage(`Error accessing camera: ${lastError.message || 'Unknown error'}`)
         }
      } else {
        showMessage("Unable to access camera. Please check your device and browser settings.")
      }
    }

    isRequestingRef.current = false
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