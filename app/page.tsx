'use client'

import { CameraView } from '@/components/camera-view'
import { createCrosshairOverlay, createGridOverlay } from '@/lib/ar-overlays'
import { Button } from '@/components/ui/button'

export default function Home() {
  // Use static overlays instead of animated ones to prevent flashing
  const overlays = [
    createCrosshairOverlay('rgba(255, 255, 255, 0.6)', 40),
    createGridOverlay(100, 'rgba(255, 255, 255, 0.2)')
  ]

  const handleTakePicture = () => {
    console.log('Picture taken!')
    // TODO: Implement actual picture capture functionality
  }

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      {/* Top Header - Solid section */}
      <header 
        className="bg-gray-900 text-white"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-center">
            Base Power Site Survey
          </h1>
        </div>
      </header>
      
      {/* Camera View - Takes remaining space */}
      <div className="relative flex-1 overflow-hidden">
        <CameraView overlays={overlays} />
        
        {/* Bottom Button Container - Overlays camera view */}
        <div 
          className="absolute bottom-0 inset-x-0 z-30 px-6 pb-6"
          style={{ paddingBottom: `calc(24px + env(safe-area-inset-bottom))` }}
        >
          <Button 
            onClick={handleTakePicture}
            size="lg"
            className="w-full bg-white text-black hover:bg-gray-200 active:bg-gray-300 font-semibold py-6 text-lg shadow-lg transition-colors duration-150"
          >
            Take Picture
          </Button>
        </div>
      </div>
    </div>
  )
}
