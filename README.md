# Base Power Site Survey Tool

Electricity Meter Capture Interface - An advanced mobile-first web application for capturing and analyzing electricity meter installations using AI-powered computer vision.

## Current Implementation Status

Built with **Next.js 15**, **TypeScript**, and the latest browser APIs for camera and AR functionality. The app features real-time meter detection and validation to ensure high-quality data capture for site surveys.

### Completed Features

#### **Full-Screen Camera Interface**
- Native camera API integration with fallback support
- Mobile-optimized viewport with proper scaling
- Cross-browser compatibility (Safari, Chrome, Firefox)
- HTTPS requirement detection with user guidance

#### **AI-Powered Detection**  
- Real-time electricity meter detection using computer vision
- Validation framework with multiple quality checks
- Guided capture with visual frame overlay
- Image quality assessment (focus, lighting, angle)

#### **AR Features**
- Real-time overlay rendering on camera feed
- Dynamic guiding frames for optimal meter positioning  
- Visual feedback during capture process
- Smooth 60fps performance on mobile devices

#### **Data Collection**
- Multi-step survey flow with state management
- Captured image storage and validation
- Progress tracking with visual indicators
- Retry mechanism with user guidance

## Live Demo Flow

1. **Welcome Screen** - Overview of survey steps
2. **Meter Capture** - Full-screen camera with AR guide frame
3. **Validation** - Real-time analysis with retry options
4. **Review** - Summary of captured data

The app automatically handles camera permissions, provides HTTPS warnings, and adapts to different device capabilities.

## Tech Stack

### Core Technologies
- **Next.js 15.0.3** with App Router and TurboPack
- **TypeScript** for type safety
- **Tailwind CSS** for responsive styling
- **Jotai** for state management
- **React Hook Form** with Zod validation

### UI/UX
- **Radix UI** primitives via shadcn/ui
- **Mobile-first responsive design**
- **AR overlays** using Canvas API
- **Real-time visual feedback**

### Development
- **ESLint** with modern flat config
- **PostCSS** with custom theme system
- **Environment-based configuration**
- **Git-based version control**

## Mobile-First Design

The interface is optimized for mobile devices with full viewport utilization:

```
┌─────────────────────────┐
│     Survey Progress     │ ← Header with step progress
├─────────────────────────┤
│                         │
│    FULL-SCREEN          │ ← Camera feed fills viewport
│    CAMERA FEED          │
│                         │
│  [Controls] [Status]    │ ← Floating UI elements
│                         │
│  ┌─────────────────┐    │ ← Step instructions overlay
│  │  Meter Guide    │    │
│  │    Frame        │    │
│  └─────────────────┘    │
│                         │
│  [Capture] [Skip]       │ ← Action buttons
└─────────────────────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- HTTPS environment (required for camera access on mobile)
- Modern browser with camera API support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/base-power-site-survey-tool.git
cd base-power-site-survey-tool

# Install dependencies
npm install

# Run development server
npm run dev
```

### HTTPS Setup for Mobile Testing

Camera access on mobile devices requires HTTPS. Options:

1. **Local Development with ngrok**
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start Next.js
   npm run dev
   
   # In another terminal, create HTTPS tunnel
   ngrok http 3000
   ```

2. **Local HTTPS with mkcert**
   ```bash
   # Install mkcert
   brew install mkcert  # macOS
   
   # Create local CA
   mkcert -install
   
   # Generate certificates
   mkcert localhost
   ```

3. **Deploy to Vercel** (Automatic HTTPS)
   ```bash
   npm install -g vercel
   vercel
   ```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── camera-view.tsx    # Main camera component
│   ├── steps/             # Survey step components
│   ├── shared/            # Shared UI components
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
│   └── use-camera.ts      # Camera management hook
├── lib/                   # Utility functions
│   ├── ar-overlays.ts     # AR overlay system
│   └── meter-detection.ts # Computer vision logic
└── atoms/                 # Jotai state atoms
    ├── camera.ts          # Camera state
    └── survey.ts          # Survey flow state
```

## Key Features Implementation

### Camera Integration
The app uses the MediaDevices API with progressive enhancement:
- Primary: Modern `getUserMedia` API
- Fallback: Legacy APIs for older browsers
- Error handling with user-friendly messages
- Automatic camera selection (rear camera preferred)

### AR Overlay System
Real-time overlays are rendered using Canvas API:
- 60fps rendering loop
- Dynamic positioning based on viewport
- Customizable overlay components
- Performance optimized for mobile

### State Management
Jotai atoms provide reactive state management:
- Camera state (stream, status, captured images)
- Survey flow state (current step, captured data)
- Persistent storage for survey progress
- Type-safe state updates

## Browser Support

- **iOS**: Safari 14.5+ (iOS 14.5+)
- **Android**: Chrome 88+, Firefox 88+
- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)

Note: Camera access requires HTTPS on all mobile browsers.

## Contributing

Please read our contributing guidelines before submitting PRs.

## License

This project is proprietary software. All rights reserved.

---

Built with modern web technologies for the best mobile experience.
