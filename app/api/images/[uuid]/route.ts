import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateReviewUrls, getUserFileNames } from '@/lib/s3'
import { SurveyRepository } from '@/lib/database'

// GET /api/images/[uuid] - Get pre-signed download URLs for review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params

    // Validate UUID format
    const uuidSchema = z.string().uuid()
    const validatedUuid = uuidSchema.parse(uuid)

    // Get survey data to find uploaded files
    const survey = await SurveyRepository.findByUserId(validatedUuid)
    
    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      )
    }

    // Pass the survey data directly - getUserFileNames now handles both formats
    const fileNames = getUserFileNames(survey as Record<string, unknown>)

    if (fileNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          urls: {},
          expiresIn: 0,
          message: 'No images found for this survey',
        },
      })
    }

    // Generate pre-signed download URLs
    const result = await generateReviewUrls(validatedUuid, fileNames)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error generating download URLs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid UUID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate download URLs' },
      { status: 500 }
    )
  }
} 