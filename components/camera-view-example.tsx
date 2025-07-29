'use client'

import { useState, useCallback } from 'react'
import { CameraView } from '@/components/camera-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  createCrosshairOverlay, 
  createGridOverlay, 
  createInfoPanelOverlay, 
  createCompassOverlay,
  createMeasurementOverlay,
  type AROverlay 
} from '@/lib/ar-overlays'

export function CameraViewExample() {
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['crosshair'])
  const [siteData, setSiteData] = useState({
    location: 'Survey Point A',
    elevation: '245m',
    signal: '-72 dBm',
    temperature: '23°C',
    heading: 45
  })

  // Define available overlays
  const availableOverlays: AROverlay[] = [
    createCrosshairOverlay(),
    createGridOverlay(75),
    createInfoPanelOverlay([
      { label: 'Location', value: siteData.location },
      { label: 'Elevation', value: siteData.elevation },
      { label: 'Signal', value: siteData.signal },
      { label: 'Temperature', value: siteData.temperature }
    ]),
    createCompassOverlay({ x: 80, y: 80 }, 35, siteData.heading),
    createMeasurementOverlay([
      { x: 100, y: 200, width: 150, height: 100, label: '1.5m x 1.0m' },
      { x: 300, y: 150, width: 80, height: 80, label: '0.8m²' }
    ])
  ]

  // Filter overlays based on active selection
  const activeOverlayObjects = availableOverlays.filter(overlay => 
    activeOverlays.includes(overlay.id)
  )

  const toggleOverlay = useCallback((overlayId: string) => {
    setActiveOverlays(prev => 
      prev.includes(overlayId) 
        ? prev.filter(id => id !== overlayId)
        : [...prev, overlayId]
    )
  }, [])

  const handleCameraReady = useCallback((videoElement: HTMLVideoElement) => {
    console.log('Camera is ready:', videoElement)
    // You can perform additional setup here when camera is ready
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Full-screen camera view */}
      <CameraView 
        overlays={activeOverlayObjects}
        onCameraReady={handleCameraReady}
      />
      
      {/* Floating control panel */}
      <Card className="absolute top-4 right-4 w-64 bg-black/80 border-gray-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">AR Overlays</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { id: 'crosshair', label: 'Crosshair' },
            { id: 'grid', label: 'Grid' },
            { id: 'info-panel', label: 'Site Info' },
            { id: 'compass', label: 'Compass' },
            { id: 'measurements', label: 'Measurements' }
          ].map(({ id, label }) => (
            <Button
              key={id}
              variant={activeOverlays.includes(id) ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => toggleOverlay(id)}
            >
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Example of updating data (in a real app, this would come from sensors/APIs) */}
      <Card className="absolute bottom-4 left-4 w-48 bg-black/80 border-gray-600 text-white">
        <CardContent className="pt-4">
          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => setSiteData(prev => ({
              ...prev,
              heading: (prev.heading + 15) % 360,
              signal: `${-70 + Math.floor(Math.random() * 20)} dBm`,
              temperature: `${20 + Math.floor(Math.random() * 10)}°C`
            }))}
          >
            Update Site Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 