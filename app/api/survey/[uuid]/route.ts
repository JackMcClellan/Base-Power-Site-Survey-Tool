import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SurveyRepository, UpdateSurveyInput, StepDataSchema } from '@/lib/database'

// Validation schemas
const UpdateStepSchema = z.object({
  step: z.number().min(0),
})

const CreateOrUpdateSurveySchema = z.object({
  currentStep: z.number().optional(),
  status: z.enum(['IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']).optional(),
  stepData: z.array(StepDataSchema).optional(),
})

const CompleteSurveySchema = z.object({
  finalData: z.record(z.unknown()).optional(),
  completionNotes: z.string().optional(),
})

// GET /api/survey/[uuid] - Fetch survey
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const uuidSchema = z.string().uuid()
    const validatedUuid = uuidSchema.parse(uuid)

    const survey = await SurveyRepository.findOrCreate(validatedUuid)

    return NextResponse.json({
      success: true,
      data: {
        id: survey.id,
        userId: survey.userId,
        currentStep: survey.currentStep,
        status: survey.status,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
        completedAt: survey.completedAt,
        stepData: survey.stepData || [],
      },
    })
  } catch (error) {
    console.error('Error fetching survey:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid UUID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch survey' },
      { status: 500 }
    )
  }
}

// POST /api/survey/[uuid] - Create or update survey data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const body = await request.json()

    const uuidSchema = z.string().uuid()
    const validatedUuid = uuidSchema.parse(uuid)
    const validatedBody = CreateOrUpdateSurveySchema.parse(body)

    // Prepare update data
    const updateData: UpdateSurveyInput = {}
    if (validatedBody.currentStep !== undefined) updateData.currentStep = validatedBody.currentStep
    if (validatedBody.status !== undefined) updateData.status = validatedBody.status
    if (validatedBody.stepData !== undefined) updateData.stepData = validatedBody.stepData

    let survey = await SurveyRepository.findByUserId(validatedUuid)
    
    if (!survey) {
      survey = await SurveyRepository.create({
        userId: validatedUuid,
        ...updateData,
      })
    } else {
      survey = await SurveyRepository.update(validatedUuid, updateData)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: survey.id,
        userId: survey.userId,
        currentStep: survey.currentStep,
        status: survey.status,
        updatedAt: survey.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating survey:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update survey' },
      { status: 500 }
    )
  }
}

// PUT /api/survey/[uuid] - Update current step only
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const body = await request.json()

    const uuidSchema = z.string().uuid()
    const validatedUuid = uuidSchema.parse(uuid)
    const validatedBody = UpdateStepSchema.parse(body)

    const survey = await SurveyRepository.update(validatedUuid, {
      currentStep: validatedBody.step,
    })

    if (!survey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        currentStep: survey.currentStep,
        updatedAt: survey.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating survey step:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid step data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update step' },
      { status: 500 }
    )
  }
}

// PATCH /api/survey/[uuid] - Complete survey
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params
    const body = await request.json()

    console.log('PATCH /api/survey/[uuid] - Complete survey request:', {
      uuid,
      body,
    })

    const uuidSchema = z.string().uuid()
    const validatedUuid = uuidSchema.parse(uuid)
    // Validate request body format
    CompleteSurveySchema.parse(body)

    const existingSurvey = await SurveyRepository.findByUserId(validatedUuid)
    
    console.log('Existing survey:', {
      found: !!existingSurvey,
      status: existingSurvey?.status,
      id: existingSurvey?.id,
    })
    
    if (!existingSurvey) {
      return NextResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      )
    }

    if (existingSurvey.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Survey already completed',
        data: {
          id: existingSurvey.id,
          userId: existingSurvey.userId,
          status: existingSurvey.status,
          completedAt: existingSurvey.completedAt,
        },
      })
    }

    // Complete the survey
    const updateData: UpdateSurveyInput = { status: 'COMPLETED' }

    console.log('Updating survey with data:', updateData)

    const completedSurvey = await SurveyRepository.update(validatedUuid, updateData)

    if (!completedSurvey) {
      throw new Error('Failed to update survey - no survey returned')
    }

    console.log('Survey completed successfully:', completedSurvey.id)

    return NextResponse.json({
      success: true,
      message: 'Survey completed successfully',
      data: {
        id: completedSurvey.id,
        userId: completedSurvey.userId,
        status: completedSurvey.status,
        completedAt: completedSurvey.completedAt,
        updatedAt: completedSurvey.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error completing survey:', error)

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
      { success: false, error: 'Failed to complete survey' },
      { status: 500 }
    )
  }
} 