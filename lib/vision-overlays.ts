import { AROverlay } from './ar-overlays'
import { RealTimeFeedback } from './meter-detection'

// Create a guiding frame overlay for meter positioning
export function createMeterGuidingFrame(
  color: string = 'rgba(255, 165, 0, 0.8)', // Orange color for electrical equipment
  strokeWidth: number = 3
): AROverlay {
  return {
    id: 'meter-guiding-frame',
    render: (ctx, canvas, timestamp) => {
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

// Create detection highlight overlay to show detected objects
export function createDetectionHighlight(
  boundingBox: { x: number; y: number; width: number; height: number },
  confidence: number,
  isValid: boolean = false
): AROverlay {
  return {
    id: 'detection-highlight',
    render: (ctx, canvas) => {
      const color = isValid 
        ? `rgba(0, 255, 0, ${0.6 + confidence * 0.4})` // Green for valid detection
        : `rgba(255, 255, 0, ${0.4 + confidence * 0.4})` // Yellow for detected but not valid
      
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.setLineDash([])
      
      // Main bounding box
      ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height)
      
      // Confidence indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      const labelWidth = 100
      const labelHeight = 25
      const labelX = boundingBox.x
      const labelY = boundingBox.y - labelHeight - 5
      
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight)
      
      // Confidence text
      ctx.fillStyle = 'white'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText(
        `${Math.round(confidence * 100)}% confident`,
        labelX + 5,
        labelY + 16
      )
    }
  }
}

// Create real-time feedback overlay
export function createRealTimeFeedbackOverlay(
  feedback: RealTimeFeedback,
  position: { x: number; y: number } = { x: 20, y: 20 }
): AROverlay {
  return {
    id: 'realtime-feedback',
    render: (ctx, canvas) => {
      // Background color based on feedback type
      let backgroundColor: string
      const textColor: string = 'white'
      
      switch (feedback.type) {
        case 'success':
          backgroundColor = 'rgba(0, 128, 0, 0.8)'
          break
        case 'warning':
          backgroundColor = 'rgba(255, 165, 0, 0.8)'
          break
        case 'error':
          backgroundColor = 'rgba(255, 0, 0, 0.8)'
          break
        default:
          backgroundColor = 'rgba(0, 100, 200, 0.8)'
      }
      
      ctx.font = '14px system-ui'
      
      // Calculate dimensions
      const padding = 15
      const lineHeight = 18
      const maxWidth = canvas.width - position.x * 2
      
      // Main message
      const messageLines = wrapText(ctx, feedback.message, maxWidth - padding * 2)
      
      // Suggestions (show first 2)
      const suggestionLines = feedback.suggestions.slice(0, 2).map(s => `• ${s}`)
      
      const totalLines = messageLines.length + suggestionLines.length
      const panelHeight = totalLines * lineHeight + padding * 2
      
      // Background panel
      ctx.fillStyle = backgroundColor
      ctx.fillRect(position.x, position.y, maxWidth, panelHeight)
      
      // Border
      ctx.strokeStyle = textColor
      ctx.lineWidth = 1
      ctx.strokeRect(position.x, position.y, maxWidth, panelHeight)
      
      // Text content
      ctx.fillStyle = textColor
      ctx.textAlign = 'left'
      
      let currentY = position.y + padding + 14
      
      // Main message
      messageLines.forEach(line => {
        ctx.fillText(line, position.x + padding, currentY)
        currentY += lineHeight
      })
      
      // Suggestions
      if (suggestionLines.length > 0) {
        currentY += 5 // Extra spacing
        ctx.fillStyle = `rgba(255, 255, 255, 0.8)` // Slightly dimmed for suggestions
        suggestionLines.forEach(line => {
          ctx.fillText(line, position.x + padding, currentY)
          currentY += lineHeight
        })
      }
    }
  }
}

// Utility function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

// Create a scanning animation overlay to show active detection
export function createScanningOverlay(
  color: string = 'rgba(0, 255, 255, 0.6)'
): AROverlay {
  return {
    id: 'scanning-animation',
    render: (ctx, canvas, timestamp) => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      // Animated scanning line
      const scanLineY = (Math.sin(timestamp * 0.003) * 0.5 + 0.5) * canvas.height
      
      ctx.strokeStyle = color
      ctx.lineWidth = 2
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
      ctx.fillStyle = color
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('Scanning for meter...', centerX, centerY + 30)
    }
  }
}

// Create quality indicator overlay
export function createQualityIndicator(
  sharpness: number,
  brightness: number,
  position: { x: number; y: number } = { x: 20, y: 80 }
): AROverlay {
  return {
    id: 'quality-indicator',
    render: (ctx, canvas) => {
      const indicators = [
        { label: 'Sharpness', value: sharpness, color: sharpness > 0.6 ? 'green' : sharpness > 0.3 ? 'orange' : 'red' },
        { label: 'Brightness', value: brightness, color: Math.abs(brightness - 0.5) < 0.2 ? 'green' : 'orange' }
      ]
      
      ctx.font = '12px system-ui'
      ctx.textAlign = 'left'
      
      indicators.forEach((indicator, index) => {
        const y = position.y + index * 25
        
        // Label
        ctx.fillStyle = 'white'
        ctx.fillText(indicator.label, position.x, y)
        
        // Progress bar background
        const barX = position.x + 80
        const barWidth = 60
        const barHeight = 8
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(barX, y - 6, barWidth, barHeight)
        
        // Progress bar fill
        ctx.fillStyle = indicator.color
        ctx.fillRect(barX, y - 6, barWidth * indicator.value, barHeight)
        
        // Value text
        ctx.fillStyle = 'white'
        ctx.fillText(`${Math.round(indicator.value * 100)}%`, barX + barWidth + 10, y)
      })
    }
  }
}

// Create meter type indicator overlay
export function createMeterTypeIndicator(
  features: {
    isCircular: boolean
    isRectangular: boolean
    hasDigitalDisplay: boolean
    hasDials: boolean
  },
  position: { x: number; y: number } = { x: 20, y: 140 }
): AROverlay {
  return {
    id: 'meter-type-indicator',
    render: (ctx, canvas) => {
      ctx.font = '12px system-ui'
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