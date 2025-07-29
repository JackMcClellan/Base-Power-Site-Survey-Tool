import { atom } from 'jotai'

// Camera stream state
export const cameraStreamAtom = atom<MediaStream | null>(null)

// Camera access status
export const cameraStatusAtom = atom<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle')

// Camera error message
export const cameraErrorAtom = atom<string | null>(null)

// Camera dimensions
export const cameraDimensionsAtom = atom<{ width: number; height: number }>({ width: 0, height: 0 })

// Message display state
export const cameraMessageAtom = atom<{ message: string; visible: boolean }>({ 
  message: '', 
  visible: false 
})

// Derived atom for camera availability
export const isCameraAvailableAtom = atom((get) => {
  const status = get(cameraStatusAtom)
  return status === 'granted' && get(cameraStreamAtom) !== null
})

// Action atoms
export const showCameraMessageAtom = atom(
  null,
  (get, set, message: string) => {
    set(cameraMessageAtom, { message, visible: true })
  }
)

export const hideCameraMessageAtom = atom(
  null,
  (get, set) => {
    set(cameraMessageAtom, { message: '', visible: false })
  }
)

export const setCameraStreamAtom = atom(
  null,
  (get, set, stream: MediaStream | null) => {
    const currentStream = get(cameraStreamAtom)
    
    // Clean up previous stream
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop())
    }
    
    set(cameraStreamAtom, stream)
    set(cameraStatusAtom, stream ? 'granted' : 'idle')
  }
) 