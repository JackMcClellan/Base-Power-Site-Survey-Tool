import { AROverlay } from '@/lib/ar-overlays'

// Base props that all overlay components receive
export interface OverlayComponentProps {
  // Canvas and rendering context
  canvas?: HTMLCanvasElement
  timestamp?: number
  
  // Configuration options
  position?: {
    x: number | 'center' | 'left' | 'right'
    y: number | 'center' | 'top' | 'bottom'
  }
  size?: {
    width: number | string // percentage like '60%' or pixel value
    height: number | string
  }
  style?: {
    color: string
    strokeWidth: number
    cornerLength?: number
    dashPattern?: number[]
    opacity?: number
  }
  text?: {
    content: string
    fontSize: number
    position: 'above' | 'below' | 'inside' | 'custom'
    customPosition?: { x: number, y: number }
  }
  animation?: {
    enabled: boolean
    type: 'pulse' | 'scan' | 'rotate' | 'fade'
    duration: number
  }
}

// Function signature for overlay component factories
export type OverlayComponentFactory = (props: OverlayComponentProps) => AROverlay 