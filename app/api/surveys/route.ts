import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma, StepData } from '@/lib/database'
import { generateReviewUrls } from '@/lib/s3'
import { Status, Prisma } from '@prisma/client'
import { env } from '@/lib/env'

// Query parameters validation schema
const QueryParamsSchema = z.object({
  id: z.string().uuid().optional(),
  status: z.enum(['IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']).optional(),
})

// GET /api/surveys - Retrieve surveys with optional filtering
export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      id: searchParams.get('id') || undefined,
      status: searchParams.get('status') || undefined,
    }

    // Validate query parameters
    const validatedParams = QueryParamsSchema.parse(queryParams)

    // Build where clause
    const whereClause: Prisma.SurveyWhereInput = {}
    if (validatedParams.id) {
      whereClause.userId = validatedParams.id
    }
    if (validatedParams.status) {
      whereClause.status = validatedParams.status as Status
    }

    // Fetch surveys from database
    const surveys = await prisma.survey.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Process surveys to include presigned URLs and extract amperage
    const processedSurveys = await Promise.all(
      surveys.map(async (survey) => {
        const stepData = survey.stepData as StepData[]
        
        // Extract photo S3 keys from step data
        const photoKeys = stepData
          .filter(step => step.s3_info)
          .map(step => step.s3_info)

        // Generate presigned URLs for all photos
        let presignedUrls: Record<string, string> = {}
        if (photoKeys.length > 0) {
          try {
            const result = await generateReviewUrls(survey.userId, photoKeys)
            presignedUrls = result.urls
          } catch (error) {
            console.error(`Error generating presigned URLs for survey ${survey.userId}:`, error)
          }
        }

        // Process photos with presigned URLs
        const photos = stepData
          .filter(step => step.s3_info)
          .map(step => ({
            step_number: step.step_id,
            s3_url: `https://${env.S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${step.s3_info}`,
            presignedUrl: presignedUrls[step.s3_info] || null,
            urlExpiresIn: presignedUrls[step.s3_info] ? 3600 : null,
            analysis_result: {
              isValid: step.analysis_result?.is_valid || false,
              confidence: step.analysis_result?.confidence || 0,
              ai_feedback: step.analysis_result?.ai_feedback || '',
              extractedValue: step.analysis_result?.extracted_value,
              structuredData: step.analysis_result?.structured_data,
            },
          }))

        return {
          survey_id: survey.userId,
          start_timestamp: survey.createdAt.toISOString(),
          completion_timestamp: survey.completedAt?.toISOString() || null,
          last_updated_timestamp: survey.updatedAt.toISOString(),
          status: survey.status.toLowerCase(),
          photos,
        }
      })
    )

    return NextResponse.json({
      surveys: processedSurveys,
    })
  } catch (error) {
    console.error('Error fetching surveys:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    )
  }
} 