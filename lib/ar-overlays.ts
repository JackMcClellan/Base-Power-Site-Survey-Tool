// AR Overlay utility functions for site surveys

export interface AROverlay {
  id: string
  render: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, timestamp: number) => void
}

/**
 * Creates a crosshair overlay for precise targeting
 */
export function createCrosshairOverlay(
  color: string = 'rgba(255, 255, 255, 0.8)',
  size: number = 50
): AROverlay {
  return {
    id: 'crosshair',
    render: (ctx, canvas) => {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      
      // Horizontal line
      ctx.beginPath()
      ctx.moveTo(centerX - size, centerY)
      ctx.lineTo(centerX + size, centerY)
      ctx.stroke()
      
      // Vertical line
      ctx.beginPath()
      ctx.moveTo(centerX, centerY - size)
      ctx.lineTo(centerX, centerY + size)
      ctx.stroke()
      
      // Center dot
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
  }
}

/**
 * Creates a measurement overlay for distance/size references
 */
export function createMeasurementOverlay(
  measurements: { x: number; y: number; width: number; height: number; label: string }[],
  color: string = 'rgba(0, 255, 0, 0.8)'
): AROverlay {
  return {
    id: 'measurements',
    render: (ctx, canvas) => {
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2
      ctx.font = '14px system-ui'
      
      measurements.forEach(({ x, y, width, height, label }) => {
        // Draw measurement rectangle
        ctx.strokeRect(x, y, width, height)
        
        // Draw label with background
        const textMetrics = ctx.measureText(label)
        const labelX = x + width / 2 - textMetrics.width / 2
        const labelY = y - 10
        
        // Label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(labelX - 4, labelY - 16, textMetrics.width + 8, 20)
        
        // Label text
        ctx.fillStyle = color
        ctx.fillText(label, labelX, labelY)
      })
    }
  }
}

/**
 * Creates a grid overlay for spatial reference
 */
export function createGridOverlay(
  spacing: number = 50,
  color: string = 'rgba(255, 255, 255, 0.3)'
): AROverlay {
  return {
    id: 'grid',
    render: (ctx, canvas) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      
      // Vertical lines
      for (let x = spacing; x < canvas.width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      
      // Horizontal lines
      for (let y = spacing; y < canvas.height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      
      ctx.setLineDash([])
    }
  }
}

/**
 * Creates an info panel overlay for displaying site survey data
 */
export function createInfoPanelOverlay(
  info: { label: string; value: string }[],
  position: { x: number; y: number } = { x: 20, y: 20 },
  backgroundColor: string = 'rgba(0, 0, 0, 0.7)',
  textColor: string = 'rgba(255, 255, 255, 0.9)'
): AROverlay {
  return {
    id: 'info-panel',
    render: (ctx) => {
      const padding = 15
      const lineHeight = 20
      const maxLabelWidth = Math.max(...info.map(item => 
        ctx.measureText(item.label + ':').width
      ))
      
      const panelWidth = maxLabelWidth + 150 + (padding * 2)
      const panelHeight = (info.length * lineHeight) + (padding * 2)
      
      // Background panel
      ctx.fillStyle = backgroundColor
      ctx.fillRect(position.x, position.y, panelWidth, panelHeight)
      
      // Border
      ctx.strokeStyle = textColor
      ctx.lineWidth = 1
      ctx.strokeRect(position.x, position.y, panelWidth, panelHeight)
      
      // Text content
      ctx.fillStyle = textColor
      ctx.font = '14px system-ui'
      
      info.forEach((item, index) => {
        const y = position.y + padding + (index * lineHeight) + 14
        
        // Label
        ctx.fillText(item.label + ':', position.x + padding, y)
        
        // Value
        ctx.fillText(item.value, position.x + padding + maxLabelWidth + 10, y)
      })
    }
  }
}

/**
 * Creates a compass/orientation overlay
 */
export function createCompassOverlay(
  position: { x: number; y: number } = { x: 50, y: 50 },
  radius: number = 40,
  heading: number = 0
): AROverlay {
  return {
    id: 'compass',
    render: (ctx, canvas) => {
      const centerX = canvas.width - position.x
      const centerY = position.y
      
      // Compass circle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()
      
      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fill()
      
      // North indicator
      const northAngle = -Math.PI / 2 + (heading * Math.PI / 180)
      const northX = centerX + Math.cos(northAngle) * (radius - 10)
      const northY = centerY + Math.sin(northAngle) * (radius - 10)
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'
      ctx.beginPath()
      ctx.arc(northX, northY, 4, 0, Math.PI * 2)
      ctx.fill()
      
      // N label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('N', centerX, centerY - radius - 10)
      
      // Heading text
      ctx.fillText(`${Math.round(heading)}°`, centerX, centerY + radius + 20)
    }
  }
} 