// Simplified AI configuration for step validation
export interface AIConfig {
  userPrompt: string
}

// Simplified camera configuration (overlays removed)
export type CameraConfig = Record<string, never> // Empty object for now

// Simplified step definition
export interface SurveyStep {
  id: number
  title: string
  description: string
  instructions: string
  tips: string[]
  stepType?: 'camera' | 'data-entry'  // New field to distinguish step types
  skippable?: boolean  // Whether this step can be skipped
  cameraConfig: CameraConfig
  aiConfig: AIConfig
  dataEntryConfig?: {
    relatedStepId: number  // Which step's image to use
    dataType: 'amperage' | 'text' | 'number'
    placeholder?: string
    validation?: {
      min?: number
      max?: number
      pattern?: string
    }
  }
}

// Camera steps only - Welcome and Review are handled separately
export const SURVEY_STEPS: SurveyStep[] = [
  {
    id: 1,
    title: 'Electricity Meter Close-up',
    description: 'Capture a detailed photo of your electricity meter',
    instructions: "Let's start with your electricity meter. Please get close enough so the numbers on it are clear and legible.",
    
    tips: [
      'Get within 2-3 feet of the meter',
      'Ensure good lighting on the meter face',
      'Hold your device steady to avoid blur',
      'Make sure the entire meter is visible in the frame'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image contain an object that is identifiable as an electricity meter (circular or rectangular, with a glass/plastic cover and visible dials or digital display)? Is there visible text or numbers on the face of the meter? Is the image sharp and not blurry? Is the meter the primary subject, filling a significant portion of the frame?"
    }
  },
  {
    id: 2,
    title: 'Area Around Meter (Wide Shot)',
    description: 'Capture a wide view showing the meter and surrounding area',
    instructions: "Now, please take about 10 steps back from the wall and take a wide photo showing the entire area around the meter.",
    
    tips: [
      'Step back 10 steps from the meter',
      'Include the ground, wall, and meter in frame',
      'Show any potential obstructions like windows, doors, or utility boxes',
      'Capture the building exterior context'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Is the previously identified meter visible within a wider shot of a building's exterior wall? Does the image show the ground, the wall, and any potential obstructions like windows, doors, or other utility boxes near the meter?"
    }
  },
  {
    id: 3,
    title: 'Area to the RIGHT of Meter',
    description: 'Capture the wall and space to the right of the meter',
    instructions: "Staying where you are, please pan your camera to the right and capture the wall and any open space next to the meter.",
    
    tips: [
      'Stay in the same position as the wide shot',
      'Pan camera to the right of the meter',
      'Show the exterior wall and adjacent ground space',
      'Capture any obstacles or features in this area'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image show an exterior wall and adjacent ground space? Is it different from the previous wide shot? Does it capture the area to the right side of where the meter would be located?"
    }
  },
  {
    id: 4,
    title: 'Area to the LEFT of Meter',
    description: 'Capture the wall and space to the left of the meter',
    instructions: "Great. Now, please pan to the left and capture the wall and space on the other side of the meter.",
    
    tips: [
      'Stay in the same position',
      'Pan camera to the left of the meter',
      'Show the exterior wall and adjacent ground space',
      'Ensure this is different from the previous shots'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image show an exterior wall and adjacent ground space? Is it different from the two previous shots? Does it capture the area to the left side of where the meter would be located?"
    }
  },
  {
    id: 5,
    title: 'Adjacent Wall / Side Yard',
    description: 'Show the entire side wall of the house',
    instructions: "Let's see the whole side of the house. Please take a photo from corner to corner to show the entire wall.",
    
    tips: [
      'Step back to capture the full wall length',
      'Include house corners if possible',
      'Show the entire exterior wall expanse',
      'Capture ground area in front of the wall'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image show a long expanse of an exterior wall, likely including a corner of the house? Is the full side wall visible from corner to corner?"
    }
  },
  {
    id: 6,
    title: 'Area Behind Fence (Conditional)',
    description: 'Show the space behind any fence if present',
    instructions: "If there is a fence on this side of the house, please take a photo of the area behind it.",
    
    tips: [
      'Only take this photo if a fence is present',
      'Show the space between fence and house wall',
      'Capture any access points or gates',
      'Include fence condition and height'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image contain a fence? Does the image show the space between the fence and the house wall? If no fence is present, is this image skippable for the survey?"
    }
  },
  {
    id: 7,
    title: 'A/C Unit Label',
    description: 'Capture the technical label on your A/C unit',
    instructions: "Please find the label on your A/C unit. We need a clear, close-up photo where the 'LRA' number is readable.",
    
    tips: [
      'Look for a metallic or paper label on the unit',
      'Get close enough to read technical specifications',
      'Ensure good lighting on the label',
      'Look specifically for LRA or RLA numbers'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image contain a metallic or paper label with printed technical specifications? Can the AI detect and read text on the label? Specifically, can it identify the acronym 'LRA' or 'RLA'? Is the label the primary subject of the photo?"
    }
  },
  {
    id: 8,
    title: 'Second A/C Unit Label (Conditional)',
    description: 'Capture the label on your second A/C unit if present',
    instructions: "If you have a second A/C unit, please take a photo of its label as well. If not, you can skip this.",
    skippable: true,  // Add this line to enable skip button
    
    tips: [
      'Only take this photo if you have multiple A/C units',
      'Follow the same process as the first unit',
      'Look for LRA or RLA specifications',
      'Ensure the label is clearly readable'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image contain a metallic or paper label with printed technical specifications? Can the AI detect and read text on the label? Specifically, can it identify the acronym 'LRA' or 'RLA'? Is this a different A/C unit from the previous photo?"
    }
  },
  {
    id: 9,
    title: 'Main Breaker Box (Panel Interior)',
    description: 'Capture the interior of your main electrical panel',
    instructions: "Now, please find your main breaker box. Open the metal door and take a photo of all the switches inside.",
    
    tips: [
      'Open the panel door safely',
      'Ensure good lighting inside the panel',
      'Capture all rows of breaker switches',
      'Include the main switch at the top'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image show the inside of an electrical panel with multiple rows of breaker switches? Is the entire set of breakers visible? Can you identify individual circuit breakers?"
    }
  },
  {
    id: 10,
    title: 'Main Disconnect Switch (Close-up)',
    description: 'Capture a close-up of the main disconnect switch',
    instructions: "Find the main switch, which is usually the largest one at the top. We need a clear, close-up photo of it to see the number on the switch (e.g., 100, 150, or 200).",
    
    tips: [
      'Focus on the largest switch, usually at the top',
      'Get close enough to read the amperage number',
      'Look for numbers like 100, 125, 150, 200',
      'Ensure the switch label is clearly visible'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Does the image focus on a single, larger breaker switch, often labeled 'Main'? Is there a number (e.g., 100, 125, 150, 200) visible and readable on or near the switch? Is this clearly the main disconnect switch?"
    }
  },
  {
    id: 11,
    title: 'Confirm Main Disconnect Amperage',
    description: 'AI will read the amperage from the main switch photo',
    instructions: "The AI is analyzing your main switch photo to read the amperage number. Please confirm if the reading is correct.",
    
    tips: [
      'Review the AI-detected amperage value',
      'Confirm if the number matches what you see',
      'Enter manually if AI reading is incorrect',
      'Common values are 100A, 150A, 200A'
    ],
    
    stepType: 'data-entry',  // Mark this as a data entry step
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Read and extract the amperage number (e.g., 100, 125, 150, 200) from the main disconnect switch in this image. Return ONLY the numeric value followed by 'A' (e.g., '200A') if clearly visible. If you cannot read the number clearly, respond with 'Unable to read amperage'."
    },
    
    dataEntryConfig: {
      relatedStepId: 10,  // Use image from step 10
      dataType: 'amperage',
      placeholder: 'Enter amperage (e.g., 200)',
      validation: {
        min: 50,
        max: 400,
        pattern: '^[0-9]+$'
      }
    }
  },
  {
    id: 12,
    title: 'Area Around Main Breaker Box',
    description: 'Show the location and context of the breaker box',
    instructions: "Finally, please take a wide photo showing the area around the breaker box so we can see its location and any nearby obstructions.",
    
    tips: [
      'Step back to show the breaker box in context',
      'Include surrounding walls, floor, or ceiling',
      'Show any nearby obstacles or equipment',
      'Capture the installation environment (garage, closet, etc.)'
    ],
    
    cameraConfig: {},
    
    aiConfig: {
      userPrompt: "Is the breaker box visible within a larger context (e.g., on a garage wall, in a closet, utility room)? Does the image show the surrounding area and any potential obstructions or nearby equipment?"
    }
  }
] 