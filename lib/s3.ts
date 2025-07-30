import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'
import { env } from './env'

// Get S3 client instance
function getS3Client() {
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

const BUCKET_NAME = env.S3_BUCKET_NAME

// Validation schemas
export const UploadRequestSchema = z.object({
  userId: z.string().uuid(),
  stepId: z.number(),
  fileName: z.string(),
  contentType: z.string(),
})

export const DownloadRequestSchema = z.object({
  userId: z.string().uuid(),
  fileName: z.string(),
})

export type UploadRequest = z.infer<typeof UploadRequestSchema>
export type DownloadRequest = z.infer<typeof DownloadRequestSchema>

// Generate S3 key for organized storage
export function generateS3Key(userId: string, fileName: string, folder: 'photos' | 'processed' = 'photos'): string {
  // Clean fileName to ensure S3 compatibility
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${userId}/${folder}/${cleanFileName}`
}

// Generate a presigned URL for secure uploads
export async function generatePresignedUploadUrl({
  userId,
  stepId,
  fileName,
  contentType,
}: z.infer<typeof UploadRequestSchema>) {
  const s3Client = getS3Client()
  const key = `surveys/${userId}/step-${stepId}/${Date.now()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  })

  return { presignedUrl, key }
}

// Generate a presigned URL for downloads
export async function generatePresignedDownloadUrl({
  userId,
  fileName,
}: z.infer<typeof DownloadRequestSchema>) {
  const s3Client = getS3Client()
  const key = generateS3Key(userId, fileName)
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600, // 1 hour
  })

  return presignedUrl
}

// Direct upload utility (server-side only)
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
) {
  const s3Client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return key
}

// Generate pre-signed URL for file upload
export async function generateUploadUrl(request: UploadRequest): Promise<{
  uploadUrl: string
  key: string
  expiresIn: number
}> {
  try {
    // Validate input
    const validatedRequest = UploadRequestSchema.parse(request)
    
    // Generate S3 key
    const key = generateS3Key(validatedRequest.userId, validatedRequest.fileName)
    
    // Create put object command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: validatedRequest.contentType,
      Metadata: {
        stepId: validatedRequest.stepId.toString(),
        uploadedAt: new Date().toISOString(),
      },
    })
    
    // Generate pre-signed URL (15 minutes expiry)
    const s3Client = getS3Client()
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 15 * 60 })
    
    return {
      uploadUrl,
      key,
      expiresIn: 15 * 60,
    }
  } catch (error) {
    console.error('Failed to generate upload URL:', error)
    throw new Error('Failed to generate upload URL')
  }
}

// Generate pre-signed URL for file download
export async function generateDownloadUrl(request: DownloadRequest): Promise<{
  downloadUrl: string
  expiresIn: number
}> {
  try {
    // Validate input
    const validatedRequest = DownloadRequestSchema.parse(request)
    
    // Generate S3 key
    const key = generateS3Key(validatedRequest.userId, validatedRequest.fileName)
    
    // Create get object command
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
    
    // Generate pre-signed URL (60 minutes expiry for review)
    const s3Client = getS3Client()
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 })
    
    return {
      downloadUrl,
      expiresIn: 60 * 60,
    }
  } catch (error) {
    console.error('Failed to generate download URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

// Generate multiple download URLs for review step
export async function generateReviewUrls(userId: string, fileNames: string[]): Promise<{
  urls: Record<string, string>
  expiresIn: number
}> {
  try {
    const urls: Record<string, string> = {}
    
    for (const fileName of fileNames) {
      // Check if fileName already contains the full S3 key path
      const isFullKey = fileName.includes('/photos/') || fileName.includes('/processed/')
      
      if (isFullKey) {
        // fileName is already a full S3 key, use it directly
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
        })
        
        const s3Client = getS3Client()
        const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 60 })
        urls[fileName] = downloadUrl
      } else {
        // fileName is just the filename, generate the full key
        const { downloadUrl } = await generateDownloadUrl({ userId, fileName })
        urls[fileName] = downloadUrl
      }
    }
    
    return {
      urls,
      expiresIn: 60 * 60,
    }
  } catch (error) {
    console.error('Failed to generate review URLs:', error)
    throw new Error('Failed to generate review URLs')
  }
}

// List files for a user (helper for review step)
export function getUserFileNames(surveyData: Record<string, unknown>): string[] {
  const fileNames: string[] = []
  
  // Extract file names from meterPhotos (camelCase as stored in DB)
  if (surveyData.meterPhotos && typeof surveyData.meterPhotos === 'object') {
    const photos = surveyData.meterPhotos as Record<string, unknown>
    Object.values(photos).forEach(photo => {
      if (typeof photo === 'object' && photo !== null && 'fileName' in photo) {
        fileNames.push(photo.fileName as string)
      }
    })
  }
  
  // Also check meter_photos for backward compatibility
  if (surveyData.meter_photos && typeof surveyData.meter_photos === 'object') {
    const photos = surveyData.meter_photos as Record<string, unknown>
    Object.values(photos).forEach(photo => {
      if (typeof photo === 'object' && photo !== null && 'fileName' in photo) {
        fileNames.push(photo.fileName as string)
      }
    })
  }
  
  return fileNames
}

 