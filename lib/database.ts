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

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Validation schemas (much simpler now!)
export const CreateSurveySchema = z.object({
  userId: z.string().uuid(),
  currentStep: z.number().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
  meterPhotos: z.record(z.unknown()).optional(),
  analysisResults: z.record(z.unknown()).optional(),
  surveyResponses: z.record(z.unknown()).optional(),
  deviceInfo: z.record(z.unknown()).optional(),
  sessionMetadata: z.record(z.unknown()).optional(),
})

export const UpdateSurveySchema = z.object({
  currentStep: z.number().optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED']).optional(),
  meterPhotos: z.record(z.unknown()).optional(),
  analysisResults: z.record(z.unknown()).optional(),
  surveyResponses: z.record(z.unknown()).optional(),
  deviceInfo: z.record(z.unknown()).optional(),
  sessionMetadata: z.record(z.unknown()).optional(),
})

export type CreateSurveyInput = z.infer<typeof CreateSurveySchema>
export type UpdateSurveyInput = z.infer<typeof UpdateSurveySchema>

// Database operations (SO much simpler!)
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
        meterPhotos: surveyData.meterPhotos as any,
        analysisResults: surveyData.analysisResults as any,
        surveyResponses: surveyData.surveyResponses as any,
        deviceInfo: surveyData.deviceInfo as any,
        sessionMetadata: surveyData.sessionMetadata as any,
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

    // Merge JSON fields instead of overwriting
    const mergedData: any = {
      ...updates,
      meterPhotos: updates.meterPhotos ? {
        ...(existing.meterPhotos as any || {}),
        ...(updates.meterPhotos as any)
      } : existing.meterPhotos,
      analysisResults: updates.analysisResults ? {
        ...(existing.analysisResults as any || {}),
        ...(updates.analysisResults as any)
      } : existing.analysisResults,
      surveyResponses: updates.surveyResponses ? {
        ...(existing.surveyResponses as any || {}),
        ...(updates.surveyResponses as any)
      } : existing.surveyResponses,
      deviceInfo: updates.deviceInfo ? {
        ...(existing.deviceInfo as any || {}),
        ...(updates.deviceInfo as any)
      } : existing.deviceInfo,
      sessionMetadata: updates.sessionMetadata ? {
        ...(existing.sessionMetadata as any || {}),
        ...(updates.sessionMetadata as any)
      } : existing.sessionMetadata,
      // Auto-set completedAt when status becomes COMPLETED
      ...(updates.status === 'COMPLETED' && { completedAt: new Date() })
    }

    return await prisma.survey.update({
      where: { userId },
      data: mergedData
    })
  }

  static async findOrCreate(userId: string) {
    const existing = await this.findByUserId(userId)
    if (existing) return existing
    
    return await this.create({ userId })
  }
}

 