import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { env } from '@/lib/env'
import { getStepAIConfig, isDataExtractionStep } from '@/lib/survey-steps-config'
import { uploadToS3 } from '@/lib/s3'
import { SurveyRepository, type StepData } from '@/lib/database'

// Types for OpenAI response
interface AnalysisResponse {
  isValid?: boolean
  description?: string
  extractedValue?: string
  structuredData?: Record<string, string>
}

// Internal analysis result
interface AnalysisResult {
  overall: {
    passed: boolean
    confidence: number
    message: string
  }
  extractedValue?: string
  structuredData?: Record<string, string>
}

// API response type - extractedValue is now always included
interface APIResponse {
  isValid: boolean
  message: string
  confidence: number
  extractedValue: string  // Always included, empty string if not found
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })

    // 1. Extract and validate form data
    const formData = await request.formData()
    const image = formData.get('image') as File
    const stepNumber = formData.get('stepNumber') as string
    const surveyId = formData.get('surveyId') as string
    const isSkip = formData.get('skip') === 'true'
    const isDataEntry = formData.get('dataEntry') === 'true'
    const enteredValue = formData.get('enteredValue') as string

    // Validate required fields
    if (!stepNumber) {
      return NextResponse.json({ error: 'No step number provided' }, { status: 400 })
    }

    if (!surveyId) {
      return NextResponse.json({ error: 'No survey ID provided' }, { status: 400 })
    }

    const stepId = parseFloat(stepNumber) // Support decimal step numbers

    // Handle data entry case
    if (isDataEntry) {
      try {
        // Create step data for data entry
        const stepData: StepData = {
          step_id: stepId.toString(),
          photo_type: 'data_entry',
          s3_info: '', // No image for data entry steps
          analysis_result: {
            confidence: 1,
            is_valid: true,
            extracted_value: enteredValue || '',
            structured_data: {},
            ai_feedback: 'Data entry confirmed by user'
          }
        }
        
        // Update the survey with the data entry step data
        await SurveyRepository.updateStep(surveyId, stepData)
        
        // Return data entry response
        const response: APIResponse = {
          isValid: true,
          message: 'Data entry confirmed by user',
          confidence: 1,
          extractedValue: enteredValue || ''
        }
        
        return NextResponse.json(response)
      } catch (dbError) {
        console.error('Failed to save data entry to database:', dbError)
        return NextResponse.json(
          { 
            isValid: false,
            message: 'Failed to save data entry',
            confidence: 0,
            extractedValue: enteredValue || ''
          },
          { status: 500 }
        )
      }
    }

    // Handle skip case
    if (isSkip || !image) {
      console.log('Processing skip request for step:', stepId)
      
      try {
        // Create step data for skipped step
        const stepData: StepData = {
          step_id: stepId.toString(),
          photo_type: 'skipped',
          s3_info: '', // No image for skipped steps
          analysis_result: {
            confidence: 0,
            is_valid: false,
            extracted_value: '',
            structured_data: {},
            ai_feedback: 'Step skipped by user'
          }
        }
        
        // Update the survey with the skipped step data
        await SurveyRepository.updateStep(surveyId, stepData)
        
        console.log('Skip recorded in database for step:', stepId)
        
        // Return skip response
        const response: APIResponse = {
          isValid: false,
          message: 'Step skipped by user',
          confidence: 0,
          extractedValue: ''
        }
        
        return NextResponse.json(response)
      } catch (dbError) {
        console.error('Failed to save skip to database:', dbError)
        return NextResponse.json(
          { 
            isValid: false,
            message: 'Failed to save skip status',
            confidence: 0,
            extractedValue: ''
          },
          { status: 500 }
        )
      }
    }

    // Validate image for non-skip requests
    if (!image.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an image.' }, { status: 400 })
    }

    // Validate image size (max 20MB for OpenAI)
    const maxSize = 20 * 1024 * 1024
    if (image.size > maxSize) {
      return NextResponse.json({ error: 'Image too large. Maximum size is 20MB.' }, { status: 400 })
    }

    // 2. Get prompt configuration for this step
    const promptConfig = getStepAIConfig(stepId)
    
    if (!promptConfig) {
      return NextResponse.json({ error: `No configuration found for step ${stepNumber}` }, { status: 400 })
    }

    // 3. Prepare image for OpenAI (before S3 upload)
    console.log('Preparing image for analysis...')
    const imageBuffer = Buffer.from(await image.arrayBuffer())
    const base64Image = imageBuffer.toString('base64')
    const imageUrl = `data:${image.type};base64,${base64Image}`

    // 4. Get AI analysis FIRST (before S3 upload)
    const analysisResponse = await analyzeWithOpenAI(
      openai, 
      imageUrl, 
      promptConfig.userPrompt,
      promptConfig.structuredFields
    )
    console.log('OpenAI Response:', JSON.stringify(analysisResponse))

    // 5. Process the response
    const result = isDataExtractionStep(stepId) 
      ? processDataExtraction(analysisResponse)
      : processValidation(analysisResponse)

    // 6. Always upload image to S3 (user took photo, so save it regardless of validation)
    // Simple structure: [user_id]/step_[number].jpg - overwrites on retake
    console.log('Uploading image to S3...')
    const s3Key = `${surveyId}/step_${stepId}.jpg`
    
    await uploadToS3(imageBuffer, s3Key, image.type)
    console.log('Image uploaded to S3:', s3Key)
    
    try {
      // Create step data in the new format
      const stepData: StepData = {
        step_id: stepId.toString(),
        photo_type: isDataExtractionStep(stepId) ? 'meter_reading' : 'validation_photo',
        s3_info: s3Key, // Image is always uploaded now
        analysis_result: {
          confidence: result.overall.confidence,
          is_valid: result.overall.passed,
          extracted_value: result.extractedValue || '',
          structured_data: result.structuredData || {},
          ai_feedback: result.overall.message
        }
      }
      
      await SurveyRepository.updateStep(surveyId, stepData)
      
      console.log('Survey updated with analysis results')
    } catch (dbError) {
      console.error('Failed to update survey in database:', dbError)
      // Don't fail the request if DB update fails
    }

    // 8. Log and return results
    console.log('Analysis completed:', {
      processingTime: Date.now() - startTime,
      overallPassed: result.overall.passed,
      confidence: result.overall.confidence,
      stepId,
      surveyId
    })

    // Return simplified response
    const response: APIResponse = {
      isValid: result.overall.passed,
      message: result.overall.message,
      confidence: result.overall.confidence,
      extractedValue: result.extractedValue || ''
    }
    
    return NextResponse.json(response)

  } catch (error: unknown) {
    console.error('Image analysis error:', error)
    
    // Return error response
    return NextResponse.json(
      { 
        isValid: false,
        message: 'AI analysis failed. Please try again.',
        confidence: 0,
        extractedValue: ''
      },
      { status: 500 }
    )
  }
}

// Call OpenAI Vision API
async function analyzeWithOpenAI(
  openai: OpenAI, 
  imageUrl: string, 
  userPrompt: string, 
  structuredFields?: Record<string, string>
): Promise<AnalysisResponse> {
  // Build structured data section if fields are provided
  const hasStructuredFields = structuredFields && Object.keys(structuredFields).length > 0
  
  const structuredDataJson = hasStructuredFields
    ? `,
  "structuredData": {
    ${Object.entries(structuredFields!).map(([key]) => `"${key}": "value if found, empty string if not found"`).join(',\n    ')}
  }`
    : ''
    
  const structuredDataInstructions = hasStructuredFields
    ? `
- In "structuredData", extract the following specifications from labels:
${Object.entries(structuredFields!).map(([key, description]) => `  * ${key}: ${description}`).join('\n')}
- ALWAYS include ALL keys in structuredData, even if not found - use empty string ("") for values you cannot clearly read
- Only put actual values if you can clearly see and read them from the image`
    : ''

  const systemPrompt = `You are an expert electrical system analyst specializing in battery system installations. 

IMPORTANT: You must respond in the following JSON format:
{
  "isValid": true/false,
  "description": "Detailed description of what you see in the image",
  "extractedValue": "extracted value if applicable (e.g., '200A' for amperage)"${structuredDataJson}
}

For validation:
- Set "isValid" to true if the image clearly shows what was requested and is suitable for the survey
- Set "isValid" to false if the image doesn't show the requested content, is unclear, or unsuitable
- In "description", explain what you see and why it is or isn't valid
- If asked to extract a specific value (like amperage), include it in "extractedValue"${structuredDataInstructions}`
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 1500,
    temperature: 0.1,
    response_format: { type: "json_object" }
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  // Parse JSON response with fallback
  try {
    return JSON.parse(content)
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError)
    return {
      isValid: false,
      description: content
    }
  }
}

// Process data extraction requests (e.g., reading amperage values)
function processDataExtraction(response: AnalysisResponse): AnalysisResult {
  // Direct extraction from JSON
  if (response.extractedValue) {
    return {
      overall: {
        passed: true,
        confidence: 0.95,
        message: response.description || `Successfully extracted value: ${response.extractedValue}`
      },
      extractedValue: response.extractedValue,
      structuredData: response.structuredData
    }
  }

  // Try to extract from description
  const description = response.description || ''
  const amperageMatch = description.match(/(\d+)\s*A/i)
  
  if (amperageMatch) {
    const extractedValue = `${amperageMatch[1]}A`
    return {
      overall: {
        passed: true,
        confidence: 0.9,
        message: response.description || `Successfully extracted amperage: ${extractedValue}`
      },
      extractedValue: extractedValue,
      structuredData: response.structuredData
    }
  }

  // Check for explicit failure
  if (description.toLowerCase().includes('unable to read') || 
      description.toLowerCase().includes('cannot read')) {
    return {
      overall: {
        passed: false,
        confidence: 0,
        message: response.description || 'Unable to read amperage from image'
      }
    }
  }

  // Last resort: try to find any 2-3 digit number
  const numberMatch = description.match(/\b(\d{2,3})\b/)
  if (numberMatch) {
    const extractedValue = `${numberMatch[1]}A`
    return {
      overall: {
        passed: true,
        confidence: 0.7,
        message: response.description || `Extracted possible amperage: ${extractedValue}`
      },
      extractedValue: extractedValue,
      structuredData: response.structuredData
    }
  }

  // Complete failure
  return {
    overall: {
      passed: false,
      confidence: 0,
      message: response.description || 'Could not extract amperage value'
    }
  }
}

// Process standard validation requests
function processValidation(response: AnalysisResponse): AnalysisResult {
  const isValid = response.isValid === true
  const description = response.description || 'No description provided'
  
  return {
    overall: {
      passed: isValid,
      confidence: isValid ? 0.9 : 0.1,
      message: description
    },
    structuredData: response.structuredData
  }
} 