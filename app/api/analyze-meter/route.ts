import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Types for clarity
interface AnalysisResponse {
  isValid?: boolean
  description?: string
  extractedValue?: string
}

interface AnalysisResult {
  overall: {
    passed: boolean
    confidence: number
    message: string
  }
  extractedValue?: string
}

// Main API handler
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 1. Validate prerequisites
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI analysis service not configured' },
        { status: 500 }
      )
    }

    // 2. Extract and validate form data
    const { image, userPrompt, isDataExtraction, error } = await extractFormData(request)
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    // 3. Prepare image for OpenAI
    const imageUrl = await prepareImageForOpenAI(image!)

    // 4. Get AI analysis
    const analysisResponse = await analyzeWithOpenAI(imageUrl, userPrompt)
    console.log('OpenAI Response:', JSON.stringify(analysisResponse))

    // 5. Process the response based on request type
    let result: AnalysisResult
    
    if (isDataExtraction) {
      result = processDataExtraction(analysisResponse)
    } else {
      result = processValidation(analysisResponse)
    }

    // 6. Log and return results
    console.log('OpenAI analysis completed:', {
      processingTime: Date.now() - startTime,
      overallPassed: result.overall.passed,
      confidence: result.overall.confidence
    })

    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error('OpenAI analysis error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { 
        error: 'AI analysis failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// Helper function to extract and validate form data
async function extractFormData(request: NextRequest) {
  const formData = await request.formData()
  const image = formData.get('image') as File
  const userPrompt = formData.get('userPrompt') as string
  const isDataExtraction = formData.get('isDataExtraction') === 'true'

  // Validate image presence
  if (!image) {
    return { error: 'No image provided' }
  }

  // Validate image type
  if (!image.type.startsWith('image/')) {
    return { error: 'Invalid file type. Please upload an image.' }
  }

  // Validate image size (max 20MB for OpenAI)
  const maxSize = 20 * 1024 * 1024
  if (image.size > maxSize) {
    return { error: 'Image too large. Maximum size is 20MB.' }
  }

  return { image, userPrompt, isDataExtraction, error: null }
}

// Convert image to base64 data URL for OpenAI
async function prepareImageForOpenAI(image: File): Promise<string> {
  const bytes = await image.arrayBuffer()
  const base64Image = Buffer.from(bytes).toString('base64')
  return `data:${image.type};base64,${base64Image}`
}

// Call OpenAI Vision API
async function analyzeWithOpenAI(imageUrl: string, userPrompt?: string): Promise<AnalysisResponse> {
  const analysisPrompt = userPrompt || 'Please analyze this image for survey suitability.'
  
  const systemPrompt = `You are an expert electrical system analyst specializing in battery system installations. 

IMPORTANT: You must respond in the following JSON format:
{
  "isValid": true/false,
  "description": "Detailed description of what you see in the image",
  "extractedValue": "extracted value if applicable (e.g., '200A' for amperage)"
}

For validation:
- Set "isValid" to true if the image clearly shows what was requested and is suitable for the survey
- Set "isValid" to false if the image doesn't show the requested content, is unclear, or unsuitable
- In "description", explain what you see and why it is or isn't valid
- If asked to extract a specific value (like amperage), include it in "extractedValue"`

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
          { type: "text", text: analysisPrompt },
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
      extractedValue: response.extractedValue
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
      extractedValue: extractedValue
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
      extractedValue: extractedValue
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
    }
  }
} 