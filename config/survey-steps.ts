import { 
  GuidingFrameOverlay,
  ScanningOverlay,
  MeterTypeIndicatorOverlay,
  type OverlayComponentProps
} from '@/components/overlays'
import { AROverlay } from '@/lib/ar-overlays'

// Overlay definition with component reference
export interface OverlayDefinition {
  component: (props: OverlayComponentProps) => AROverlay
  props: OverlayComponentProps
}

// Simplified AI configuration for step validation
export interface AIConfig {
  systemPrompt: string
  userPrompt: string
}

// Simplified camera configuration
export interface CameraConfig {
  overlays: OverlayDefinition[]
}

// Simplified step definition
export interface SurveyStep {
  id: number
  title: string
  description: string
  instructions: string
  tips: string[]
  cameraConfig: CameraConfig
  aiConfig: AIConfig
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
    
    cameraConfig: {
      overlays: [
        {
          component: GuidingFrameOverlay,
          props: {
            position: { x: 'center', y: 'center' },
            size: { width: '60%', height: '40%' },
            style: {
              color: 'rgba(208, 245, 133, 0.8)',
              strokeWidth: 3,
              cornerLength: 20,
              dashPattern: [10, 5]
            },
            text: {
              content: 'Position meter within this frame',
              fontSize: 16,
              position: 'above'
            }
          }
        }
      ]
    },
    
    aiConfig: {
      systemPrompt: "You are an expert electrical system analyst. Your task is to analyze images of electricity meters to determine if they are suitable for battery system installation assessment.",
      userPrompt: "Please analyze this image of an electricity meter and provide a detailed assessment. Focus on meter identification, text/number visibility, image quality, and framing. Provide specific feedback on what's working well and what could be improved."
    }
  },
  {
    id: 2,
    title: 'Electricity Meter Wide View',
    description: 'Capture a wide view showing the meter and surrounding area',
    instructions: "Now let's get a wider view. Step back and capture the meter along with the surrounding area to show the installation space.",
    
    tips: [
      'Step back 6-8 feet from the meter',
      'Include at least 3 feet of space around the meter',
      'Show the wall or surface the meter is mounted on',
      'Include any nearby electrical panels or equipment'
    ],
    
    cameraConfig: {
      overlays: [
        {
          component: GuidingFrameOverlay,
          props: {
            position: { x: 'center', y: 'center' },
            size: { width: '80%', height: '60%' },
            style: {
              color: 'rgba(75, 191, 251, 0.8)',
              strokeWidth: 2,
              cornerLength: 30,
              dashPattern: [15, 10]
            },
            text: {
              content: 'Include meter and surrounding area within this frame',
              fontSize: 14,
              position: 'above'
            }
          }
        }
      ]
    },
    
    aiConfig: {
      systemPrompt: "You are an expert electrical installation analyst. Your task is to analyze wide-view images of electricity meters to assess the installation space and surrounding environment for battery system planning.",
      userPrompt: "Please analyze this wide-view image of an electricity meter installation. Focus on meter visibility in context, surrounding area assessment, installation type identification, and space adequacy for additional equipment."
    }
  },
  {
    id: 3,
    title: 'Electrical Panel',
    description: 'Capture your main electrical panel or breaker box',
    instructions: "Now let's find your main electrical panel (breaker box). This is usually located near your meter or in your garage, basement, or utility room.",
    
    tips: [
      'Open the panel door if safely accessible',
      'Ensure good lighting inside the panel',
      'Capture both the main switch and individual breakers',
      'Note the panel manufacturer and model if visible'
    ],
    
    cameraConfig: {
      overlays: [
        {
          component: GuidingFrameOverlay,
          props: {
            position: { x: 'center', y: 'center' },
            size: { width: '70%', height: '50%' },
            style: {
              color: 'rgba(255, 107, 0, 0.8)',
              strokeWidth: 3,
              cornerLength: 25,
              dashPattern: [8, 6]
            },
            text: {
              content: 'Frame the electrical panel within this area',
              fontSize: 15,
              position: 'above'
            }
          }
        }
      ]
    },
    
    aiConfig: {
      systemPrompt: "You are an expert electrical panel analyst. Your task is to analyze images of electrical panels to assess their condition and capacity for battery system integration.",
      userPrompt: "Please analyze this electrical panel image. Focus on panel type identification, breaker visibility, main switch accessibility, available space for additional equipment, and overall panel condition for battery system integration."
    }
  },
  {
    id: 4,
    title: 'Installation Space',
    description: 'Show the area where the battery system would be installed',
    instructions: "Let's capture the space where your battery system would be installed. This is typically near your electrical panel, in a garage, basement, or utility room.",
    
    tips: [
      'Show at least 6 feet of wall space',
      'Include the floor area in front of the wall',
      'Capture any nearby obstacles or equipment',
      'Show ceiling height if in enclosed space',
      'Include electrical panel if nearby'
    ],
    
    cameraConfig: {
      overlays: [
        {
          component: GuidingFrameOverlay,
          props: {
            position: { x: 'center', y: 'center' },
            size: { width: '85%', height: '70%' },
            style: {
              color: 'rgba(147, 51, 234, 0.7)',
              strokeWidth: 2,
              cornerLength: 35,
              dashPattern: [12, 8]
            },
            text: {
              content: 'Capture installation area - include wall and floor space',
              fontSize: 14,
              position: 'below'
            }
          }
        },
        {
          component: ScanningOverlay,
          props: {
            style: {
              color: 'rgba(147, 51, 234, 0.4)',
              strokeWidth: 1
            },
            text: {
              content: 'Scanning space...',
              fontSize: 12,
              position: 'below'
            }
          }
        }
      ]
    },
    
    aiConfig: {
      systemPrompt: "You are an expert battery installation space analyst. Your task is to evaluate potential installation locations for residential battery systems.",
      userPrompt: "Please analyze this potential battery installation space. Focus on space adequacy for equipment, wall structure suitability, clearance for maintenance, environmental factors, and accessibility for installation and maintenance."
    }
  },
  {
    id: 5,
    title: 'Utility Connection Point',
    description: 'Capture where utility lines connect to your property',
    instructions: "Let's capture where the utility power lines connect to your property. This is usually where lines from the street connect to your home's electrical system.",
    
    tips: [
      'Look for where power lines connect to your home',
      'Include the service entrance conduit or cable',
      'Show both the connection point and meter location',
      'Capture any nearby utility transformers',
      'Note if service is overhead or underground'
    ],
    
    cameraConfig: {
      overlays: [
        {
          component: GuidingFrameOverlay,
          props: {
            position: { x: 'center', y: 'center' },
            size: { width: '90%', height: '75%' },
            style: {
              color: 'rgba(34, 197, 94, 0.8)',
              strokeWidth: 2,
              cornerLength: 40,
              dashPattern: [20, 12]
            },
            text: {
              content: 'Include utility connection and service entrance',
              fontSize: 13,
              position: 'above'
            }
          }
        },
        {
          component: MeterTypeIndicatorOverlay,
          props: {
            position: { x: 'right', y: 'top' }
          }
        }
      ]
    },
    
    aiConfig: {
      systemPrompt: "You are an expert utility connection analyst. Your task is to analyze utility service connections to understand the electrical service configuration for battery system planning.",
      userPrompt: "Please analyze this utility connection image. Focus on service type identification (overhead/underground), connection point location, service entrance visibility, utility equipment assessment, and service capacity determination."
    }
  }
] 