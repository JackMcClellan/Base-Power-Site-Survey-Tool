# Survey Step Configuration System

This system provides a comprehensive, configuration-driven approach to adding new survey steps. Each step is fully configured through the `surveyStepsAtom` in `atoms/survey.ts`.

## Adding a New Step

To add a new step, simply add a new configuration object to the `surveyStepsAtom` array. Here's the complete structure:

```typescript
{
  id: 5, // Unique step ID
  title: 'Electrical Panel',
  description: 'Capture the main electrical panel',
  type: 'camera', // 'dashboard' | 'camera' | 'review'
  stepType: 'electrical_panel', // Used for validation and data storage
  isStep: true, // Whether this counts as a survey step (false for welcome/review)
  instructions: "Locate and photograph your main electrical panel...",
  
  // Validation configuration
  validationChecks: [
    {
      name: 'panel_identification',
      description: 'Is this clearly an electrical panel?',
      required: true,
      weight: 1.0 // Importance weight for overall score
    }
    // Add more checks...
  ],
  
  // Tips and guidance
  tips: [
    'Open the panel door if safely accessible',
    'Ensure all circuit breakers are visible'
  ],
  
  warnings: [
    'Do not touch any electrical components',
    'If panel is locked, do not attempt to open'
  ],
  
  // Camera and overlay configuration
  cameraConfig: {
    overlays: [
      {
        type: 'guiding_frame',
        position: { x: 'center', y: 'center' },
        size: { width: '70%', height: '50%' },
        style: {
          color: 'rgba(255, 111, 97, 0.8)', // Orange/red for electrical panels
          strokeWidth: 3,
          cornerLength: 25,
          dashPattern: [12, 8]
        },
        text: {
          content: 'Position electrical panel within this frame',
          fontSize: 15,
          position: 'above'
        }
      }
    ],
    autoCapture: false,
    captureDelay: 500,
    maxRetries: 3,
    qualityThresholds: {
      minSharpness: 0.6,
      minBrightness: 0.3,
      maxBrightness: 0.9
    }
  },
  
  // OpenAI analysis configuration
  aiConfig: {
    systemPrompt: "You are an expert electrical system analyst...",
    userPrompt: "Please analyze this electrical panel image...",
    analysisInstructions: [
      'Identify if this is clearly an electrical panel',
      'Check if circuit breakers or fuses are visible',
      'Assess image quality and lighting'
    ],
    expectedObjects: [
      'electrical panel',
      'circuit breakers',
      'panel door',
      'electrical meter'
    ],
    qualityRequirements: {
      minSharpness: 0.6,
      minBrightness: 0.3,
      maxBrightness: 0.9,
      minFrameOccupancy: 0.4,
      maxFrameOccupancy: 0.8
    },
    failureReasons: [
      'No electrical panel visible',
      'Panel door is closed and contents not visible',
      'Image too blurry to read labels'
    ]
  },
  
  // Layout configuration
  layoutConfig: {
    showProgressBar: true,
    showStepNumber: true,
    instructionsPosition: 'bottom',
    actionsPosition: 'bottom'
  }
}
```

## Configuration Options

### Overlay Types
- `guiding_frame`: Shows a frame where the user should position the subject
- `detection_highlight`: Highlights detected objects (for real-time feedback)
- `scanning`: Shows scanning animation
- `quality_indicator`: Shows image quality metrics
- `meter_type_indicator`: Shows detected meter type

### Overlay Positioning
- Position values can be: numbers (pixels), 'center', 'left', 'right', 'top', 'bottom'
- Size values can be: numbers (pixels) or percentages ('60%')

### Text Positioning
- `above`: Above the overlay
- `below`: Below the overlay  
- `inside`: Inside the overlay
- `custom`: Use customPosition coordinates

### AI Configuration
The `aiConfig` section provides all the prompts and requirements for OpenAI analysis:
- `systemPrompt`: Sets the AI's role and expertise
- `userPrompt`: The main analysis request
- `analysisInstructions`: Specific things to check
- `expectedObjects`: Objects the AI should look for
- `qualityRequirements`: Technical quality thresholds
- `failureReasons`: Common reasons for validation failure

## Step Types

Currently supported step types:
- `welcome`: Introduction/dashboard page
- `electricity_meter_closeup`: Close-up meter photo
- `electricity_meter_wide`: Wide-angle meter photo  
- `electrical_panel`: Main electrical panel photo
- `installation_space`: Installation area assessment
- `review`: Final review page

## Example: Adding a "Electrical Panel" Step

```typescript
// Add this to the surveyStepsAtom array in atoms/survey.ts
{
  id: 5,
  title: 'Electrical Panel',
  description: 'Capture your main electrical panel',
  type: 'camera',
  stepType: 'electrical_panel',
  isStep: true,
  instructions: "Locate your main electrical panel (usually in basement, garage, or utility room) and capture a clear photo with the panel door open if safely accessible.",
  
  validationChecks: [
    {
      name: 'panel_identification',
      description: 'Is this clearly an electrical panel with visible breakers?',
      required: true,
      weight: 1.0
    },
    {
      name: 'breakers_visible',
      description: 'Are individual circuit breakers clearly visible?',
      required: true,
      weight: 0.9
    },
    {
      name: 'labels_readable',
      description: 'Can you read the labels on the breakers?',
      required: false,
      weight: 0.6
    }
  ],
  
  tips: [
    'Open panel door if there is one and it\'s safe to do so',
    'Ensure all circuit breakers are visible',
    'Look for the main breaker (usually at top)',
    'Take photo straight-on to avoid shadows'
  ],
  
  warnings: [
    'Do not touch any electrical components',
    'If panel is locked or sealed, do not attempt to open',
    'Maintain safe distance from exposed electrical parts'
  ],
  
  cameraConfig: {
    overlays: [
      {
        type: 'guiding_frame',
        position: { x: 'center', y: 'center' },
        size: { width: '70%', height: '50%' },
        style: {
          color: 'rgba(255, 111, 97, 0.8)',
          strokeWidth: 3,
          cornerLength: 25
        },
        text: {
          content: 'Position electrical panel within this frame',
          fontSize: 15,
          position: 'above'
        }
      }
    ],
    qualityThresholds: {
      minSharpness: 0.6,
      minBrightness: 0.3,
      maxBrightness: 0.9
    }
  },
  
  aiConfig: {
    systemPrompt: "You are an expert electrical system analyst specializing in residential and commercial electrical panels.",
    userPrompt: "Please analyze this electrical panel image for battery system installation planning. Look for: 1) Panel type and condition, 2) Available breaker spaces, 3) Main breaker size, 4) Overall panel capacity and condition.",
    analysisInstructions: [
      'Identify panel brand and type (main panel vs sub-panel)',
      'Count available breaker spaces',
      'Identify main breaker amperage if visible',
      'Assess overall condition and age of panel',
      'Look for any obvious code violations or safety issues'
    ],
    expectedObjects: [
      'electrical panel',
      'circuit breakers',
      'main breaker',
      'panel labels',
      'electrical meter connection'
    ],
    qualityRequirements: {
      minSharpness: 0.6,
      minBrightness: 0.3,
      maxBrightness: 0.9,
      minFrameOccupancy: 0.4,
      maxFrameOccupancy: 0.8
    }
  }
}
```

## Benefits of This System

1. **Easy to Add Steps**: Just add a configuration object - no component changes needed
2. **Consistent UI**: All camera steps use the same component with different configurations  
3. **Flexible Overlays**: Each step can have custom overlay positioning, colors, and animations
4. **AI Integration**: Each step has its own specialized OpenAI prompts and validation criteria
5. **Safety Features**: Built-in warnings and tips system
6. **Quality Control**: Configurable quality thresholds per step type
7. **Progress Tracking**: Automatic progress calculation based on `isStep` flag

## Next Steps
- Add more step types as needed
- Extend overlay types for specific use cases
- Add step-specific validation logic
- Implement step branching/conditional logic 