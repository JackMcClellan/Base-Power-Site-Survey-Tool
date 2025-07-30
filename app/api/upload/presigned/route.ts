import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateUploadUrl, UploadRequestSchema } from '@/lib/s3'

// POST /api/upload/presigned - Generate pre-signed upload URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedRequest = UploadRequestSchema.parse(body)

    // Generate pre-signed upload URL
    const result = await generateUploadUrl(validatedRequest)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error generating upload URL:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
} 