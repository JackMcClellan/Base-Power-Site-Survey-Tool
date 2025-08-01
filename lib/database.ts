/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { env } from './env'

// Prisma client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma with SSL if needed
const prismaOptions: ConstructorParameters<typeof PrismaClient>[0] = env.DATABASE_SSL 
  ? {
      datasources: {
        db: {
          url: `${env.DATABASE_URL}${env.DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`
        }
      }
    }
  : {}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

globalForPrisma.prisma = prisma

// Step data schema
export const StepDataSchema = z.object({
  step_id: z.string(),
  photo_type: z.string(),
  s3_info: z.string(),
  analysis_result: z.object({
    confidence: z.number(),
    is_valid: z.boolean(),
    extracted_value: z.string().optional(),
    structured_data: z.record(z.string()).optional(),
    ai_feedback: z.string()
  })
})

export type StepData = z.infer<typeof StepDataSchema>

// Validation schemas
export const CreateSurveySchema = z.object({
  userId: z.string().uuid(),
  currentStep: z.number().optional(),
  status: z.enum(['IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']).optional(),
  stepData: z.array(StepDataSchema).optional(),
})

export const UpdateSurveySchema = z.object({
  currentStep: z.number().optional(),
  status: z.enum(['IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED']).optional(),
  stepData: z.array(StepDataSchema).optional(),
})

export type CreateSurveyInput = z.infer<typeof CreateSurveySchema>
export type UpdateSurveyInput = z.infer<typeof UpdateSurveySchema>

// Database operations
export class SurveyRepository {
  static async findByUserId(userId: string) {
    return await prisma.survey.findUnique({
      where: { userId }
    })
  }

  static async create(surveyData: CreateSurveyInput) {
    return await prisma.survey.create({
      data: {
        userId: surveyData.userId,
        currentStep: surveyData.currentStep ?? 0,
        status: surveyData.status ?? 'IN_PROGRESS',
        stepData: surveyData.stepData ?? [],
      }
    })
  }

  static async update(userId: string, updates: UpdateSurveyInput) {
    // First get existing survey to merge data
    const existing = await prisma.survey.findUnique({
      where: { userId }
    })
    
    if (!existing) {
      throw new Error('Survey not found')
    }

    // Handle stepData merging
    let mergedStepData = existing.stepData as StepData[]
    
    if (updates.stepData) {
      // If new stepData is provided, append or update existing steps
      mergedStepData = updates.stepData
    }

    // Prepare update data
    const updateData: any = {
      ...updates,
      stepData: mergedStepData,
      // Auto-set completedAt when status becomes COMPLETED
      ...(updates.status === 'COMPLETED' && { completedAt: new Date() })
    }

    return await prisma.survey.update({
      where: { userId },
      data: updateData
    })
  }

  static async findOrCreate(userId: string) {
    const existing = await this.findByUserId(userId)
    if (existing) return existing
    
    return await this.create({ userId })
  }

  // Helper method to add or update a single step
  static async updateStep(userId: string, stepData: StepData) {
    const existing = await this.findByUserId(userId)
    if (!existing) {
      throw new Error('Survey not found')
    }

    const existingSteps = (existing.stepData as StepData[]) || []
    
    // Find and update existing step or add new one
    const stepIndex = existingSteps.findIndex(s => s.step_id === stepData.step_id)
    
    if (stepIndex >= 0) {
      existingSteps[stepIndex] = stepData
    } else {
      existingSteps.push(stepData)
    }

    // Sort steps by step_id for consistency
    existingSteps.sort((a, b) => parseFloat(a.step_id) - parseFloat(b.step_id))

    return await this.update(userId, {
      stepData: existingSteps,
      currentStep: Math.max(parseFloat(stepData.step_id), existing.currentStep)
    })
  }
}

 