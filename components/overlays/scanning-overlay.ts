import { AROverlay } from '@/lib/ar-overlays'
import { OverlayComponentProps } from './types'

export function ScanningOverlay(props: OverlayComponentProps): AROverlay {
  return {
    id: 'scanning-animation',
    render: (ctx, canvas, timestamp) => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const color = props.style?.color || 'rgba(0, 255, 255, 0.6)'
      
      if (!timestamp) return
      
      // Animated scanning line
      const scanLineY = (Math.sin(timestamp * 0.003) * 0.5 + 0.5) * canvas.height
      
      ctx.strokeStyle = color
      ctx.lineWidth = props.style?.strokeWidth || 2
      ctx.setLineDash([5, 5])
      
      // Horizontal scanning line
      ctx.beginPath()
      ctx.moveTo(0, scanLineY)
      ctx.lineTo(canvas.width, scanLineY)
      ctx.stroke()
      
      // Pulsing center dot
      const pulseRadius = 5 + Math.sin(timestamp * 0.01) * 3
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
      ctx.fill()
      
      // Scanning text
      if (props.text) {
        ctx.fillStyle = color
        ctx.font = `${props.text.fontSize || 12}px system-ui`
        ctx.textAlign = 'center'
        ctx.fillText(props.text.content, centerX, centerY + 30)
      }
    }
  }
} 