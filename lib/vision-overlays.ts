import { AROverlay } from './ar-overlays'

// Create a guiding frame overlay for meter positioning (used as fallback)
export function createMeterGuidingFrame(
  color: string = 'rgba(255, 165, 0, 0.8)',
  strokeWidth: number = 3
): AROverlay {
  return {
    id: 'meter-guiding-frame',
    render: (ctx, canvas) => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      // Target frame size (roughly 60% of screen for good meter framing)
      const frameWidth = canvas.width * 0.6
      const frameHeight = canvas.height * 0.4
      
      const frameX = centerX - frameWidth / 2
      const frameY = centerY - frameHeight / 2
      
      ctx.strokeStyle = color
      ctx.lineWidth = strokeWidth
      ctx.setLineDash([10, 5])
      
      // Main frame
      ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)
      
      // Corner indicators for better visibility
      const cornerLength = 20
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
      ctx.fillStyle = color
      ctx.font = '16px system-ui'
      ctx.textAlign = 'center'  
      ctx.fillText('Position meter within this frame', centerX, frameY - 20)
    }
  }
} 