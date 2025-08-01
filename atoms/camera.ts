import { atom } from 'jotai'

// Camera dimensions
export const cameraDimensionsAtom = atom<{ width: number; height: number }>({ width: 0, height: 0 })

// Message display state
export const cameraMessageAtom = atom<{ message: string; visible: boolean }>({ 
  message: '', 
  visible: false 
})

// Action atoms
export const hideCameraMessageAtom = atom(
  null,
  (get, set) => {
    set(cameraMessageAtom, { message: '', visible: false })
  }
) 