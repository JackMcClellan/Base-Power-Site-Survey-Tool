import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const step = formData.get('step') as string
    const timestamp = formData.get('timestamp') as string

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Log the analysis request
    console.log(`Analyzing ${step} image:`, {
      filename: image.name,
      size: image.size,
      type: image.type,
      timestamp
    })

    // TODO: Replace this with actual AI/ML analysis
    // For now, return mock results that simulate successful meter detection
    const isWideShot = step === 'electricity-meter-wide'
    
    const mockAnalysisResult = {
      overall: { 
        passed: true, 
        confidence: isWideShot ? 0.82 : 0.85, 
        message: isWideShot ? 
          'Installation area successfully analyzed with good environmental context' :
          'Electricity meter successfully detected and analyzed' 
      },
      checks: {
        meter_identification: { 
          passed: true, 
          confidence: isWideShot ? 0.85 : 0.9, 
          message: isWideShot ? 
            'Electric meter visible in installation context' :
            'Electric meter clearly identified' 
        },
        visible_text_numbers: { 
          passed: true, 
          confidence: isWideShot ? 0.7 : 0.8, 
          message: isWideShot ?
            'Meter details discernible in wide view' :
            'Meter readings are visible and readable' 
        },
        image_sharpness: { 
          passed: true, 
          confidence: 0.85, 
          message: 'Image quality is good for analysis' 
        },
        primary_subject: { 
          passed: true, 
          confidence: isWideShot ? 0.85 : 0.9, 
          message: isWideShot ?
            'Installation area provides good environmental context' :
            'Meter occupies sufficient portion of the frame' 
        }
      },
      detectionData: {
        objectType: isWideShot ? 'electricity_meter_area' : 'electric_meter',
        boundingBox: isWideShot ? 
          { x: 400, y: 300, width: 200, height: 150 } :  // Smaller box for wide shot
          { x: 120, y: 80, width: 340, height: 280 },    // Larger box for close-up
        confidence: isWideShot ? 0.82 : 0.85,
        features: {
          hasVisibleText: isWideShot ? false : true,
          hasNumbers: isWideShot ? false : true,
          isCircular: false,
          isRectangular: true,
          hasGlassCover: isWideShot ? false : true,
          hasDigitalDisplay: isWideShot ? false : true,
          hasDials: false
        },
        frameOccupancy: isWideShot ? 0.25 : 0.75  // Much smaller for wide shot
      },
      imageQuality: {
        sharpness: 0.85,
        brightness: 0.7,
        contrast: 0.8,
        overallQuality: 'good' as const,
        qualityScore: 0.82
      },
      qualityScore: isWideShot ? 0.82 : 0.85,
      processingTime: Math.random() * 2000 + 1000, // 1-3 seconds
      timestamp: new Date().toISOString()
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))

    return NextResponse.json(mockAnalysisResult)

  } catch (error) {
    console.error('Analysis API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during analysis' },
      { status: 500 }
    )
  }
} 