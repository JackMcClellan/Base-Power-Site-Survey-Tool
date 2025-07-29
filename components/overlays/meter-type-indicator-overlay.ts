import { AROverlay } from '@/lib/ar-overlays'
import { OverlayComponentProps } from './types'

// Helper function to resolve position values
function resolvePosition(
  value: number | 'center' | 'left' | 'right' | 'top' | 'bottom',
  canvasSize: number
): number {
  if (typeof value === 'number') return value
  
  switch (value) {
    case 'center':
      return canvasSize / 2
    case 'left':
    case 'top':
      return 0
    case 'right':
    case 'bottom':
      return canvasSize
    default:
      return canvasSize / 2
  }
}

interface MeterTypeIndicatorProps extends OverlayComponentProps {
  features?: {
    isCircular: boolean
    isRectangular: boolean
    hasDigitalDisplay: boolean
    hasDials: boolean
  }
}

export function MeterTypeIndicatorOverlay(props: MeterTypeIndicatorProps): AROverlay {
  return {
    id: 'meter-type-indicator',
    render: (ctx) => {
      // Default features if not provided
      const features = props.features || {
        isCircular: false,
        isRectangular: true,
        hasDigitalDisplay: true,
        hasDials: false
      }
      
      const position = {
        x: props.position ? resolvePosition(props.position.x, 1920) : 20, // Canvas width not available here
        y: props.position ? resolvePosition(props.position.y, 1080) : 140  // Canvas height not available here
      }
      
      ctx.font = `${props.text?.fontSize || 12}px system-ui`
      ctx.textAlign = 'left'
      ctx.fillStyle = 'white'
      
      let meterType = 'Unknown'
      if (features.isCircular && features.hasDials) {
        meterType = 'Analog (Dial)'
      } else if (features.isRectangular && features.hasDigitalDisplay) {
        meterType = 'Digital'
      } else if (features.isRectangular) {
        meterType = 'Analog (Rectangle)'
      }
      
      // Background
      const text = `Meter Type: ${meterType}`
      const textWidth = ctx.measureText(text).width
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(position.x - 5, position.y - 15, textWidth + 10, 20)
      
      // Text
      ctx.fillStyle = 'white'
      ctx.fillText(text, position.x, position.y)
    }
  }
} 