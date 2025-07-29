import { AROverlay } from '@/lib/ar-overlays'
import { OverlayComponentProps } from './types'

// Helper functions from vision-overlays
function resolvePosition(
  value: number | 'center' | 'left' | 'right' | 'top' | 'bottom',
  dimension: 'width' | 'height',
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

function resolveSize(
  value: number | string,
  canvasSize: number
): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.endsWith('%')) {
    const percentage = parseFloat(value) / 100
    return canvasSize * percentage
  }
  return parseFloat(value) || 0
}

export function GuidingFrameOverlay(props: OverlayComponentProps): AROverlay {
  return {
    id: 'guiding-frame',
    render: (ctx, canvas, timestamp) => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      // Resolve position
      const x = props.position ? resolvePosition(props.position.x, 'width', canvas.width) : centerX
      const y = props.position ? resolvePosition(props.position.y, 'height', canvas.height) : centerY
      
      // Resolve size
      const frameWidth = props.size ? resolveSize(props.size.width, canvas.width) : canvas.width * 0.6
      const frameHeight = props.size ? resolveSize(props.size.height, canvas.height) : canvas.height * 0.4
      
      const frameX = x - frameWidth / 2
      const frameY = y - frameHeight / 2
      
      // Apply style
      const color = props.style?.color || 'rgba(255, 165, 0, 0.8)'
      const strokeWidth = props.style?.strokeWidth || 3
      const cornerLength = props.style?.cornerLength || 20
      const dashPattern = props.style?.dashPattern || [10, 5]
      
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.setLineDash(dashPattern)
      
      // Main frame
      ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)
      
      // Corner indicators for better visibility
      ctx.setLineDash([])
      ctx.lineWidth = strokeWidth + 1
      
      // Top-left corner
      ctx.beginPath()
      ctx.moveTo(frameX, frameY + cornerLength)
      ctx.lineTo(frameX, frameY)
      ctx.lineTo(frameX + cornerLength, frameY)
      ctx.stroke()
      
      // Top-right corner
      ctx.beginPath()
      ctx.moveTo(frameX + frameWidth - cornerLength, frameY)
      ctx.lineTo(frameX + frameWidth, frameY)
      ctx.lineTo(frameX + frameWidth, frameY + cornerLength)
      ctx.stroke()
      
      // Bottom-left corner
      ctx.beginPath()
      ctx.moveTo(frameX, frameY + frameHeight - cornerLength)
      ctx.lineTo(frameX, frameY + frameHeight)
      ctx.lineTo(frameX + cornerLength, frameY + frameHeight)
      ctx.stroke()
      
      // Bottom-right corner
      ctx.beginPath()
      ctx.moveTo(frameX + frameWidth - cornerLength, frameY + frameHeight)
      ctx.lineTo(frameX + frameWidth, frameY + frameHeight)
      ctx.lineTo(frameX + frameWidth, frameY + frameHeight - cornerLength)
      ctx.stroke()
      
      // Instruction text
      if (props.text) {
        ctx.fillStyle = color
        ctx.font = `${props.text.fontSize || 16}px system-ui`
        ctx.textAlign = 'center'
        
        let textX = centerX
        let textY = frameY - 20
        
        switch (props.text.position) {
          case 'above':
            textX = centerX
            textY = frameY - 20
            break
          case 'below':
            textX = centerX
            textY = frameY + frameHeight + 30
            break
          case 'inside':
            textX = centerX
            textY = centerY
            break
          case 'custom':
            if (props.text.customPosition) {
              textX = props.text.customPosition.x
              textY = props.text.customPosition.y
            }
            break
        }
        
        ctx.fillText(props.text.content, textX, textY)
      }
      
      // Apply animation if configured
      if (props.animation?.enabled && timestamp) {
        applyAnimation(ctx, props.animation, timestamp, frameX, frameY, frameWidth, frameHeight)
      }
    }
  }
}

// Apply animation effects
function applyAnimation(
  ctx: CanvasRenderingContext2D,
  animation: NonNullable<OverlayComponentProps['animation']>,
  timestamp: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const phase = (timestamp / animation.duration) % (2 * Math.PI)
  
  switch (animation.type) {
    case 'pulse':
      const pulseScale = 1 + Math.sin(phase) * 0.1
      ctx.save()
      ctx.translate(x + width / 2, y + height / 2)
      ctx.scale(pulseScale, pulseScale)
      ctx.translate(-(x + width / 2), -(y + height / 2))
      break
    case 'fade':
      const opacity = 0.5 + Math.sin(phase) * 0.5
      ctx.globalAlpha = opacity
      break
    case 'rotate':
      ctx.save()
      ctx.translate(x + width / 2, y + height / 2)
      ctx.rotate(phase)
      ctx.translate(-(x + width / 2), -(y + height / 2))
      break
  }
} 