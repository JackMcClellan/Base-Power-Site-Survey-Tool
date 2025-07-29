# Phase 1: MVP (Minimum Viable Product)

## Goal
Create a functional proof-of-concept that demonstrates core AR object detection and basic survey flow. This phase focuses on validating the technical approach and user experience fundamentals.

## Core Features

###  Project Foundation
- [ ] Next.js 15 application setup with TypeScript
- [ ] ShadCN UI component library integration
- [ ] Jotai state management implementation
- [ ] Project structure and configuration
- [ ] Basic routing and navigation
- [ ] ESLint and development tooling

###  Survey Framework
- [ ] Survey configuration system (JSON-based)
- [ ] Step-based survey flow with progress tracking
- [ ] State management for survey data
- [ ] Navigation between survey steps
- [ ] Survey completion handling
- [ ] Local data persistence (localStorage)

###  Core Utilities & APIs
- [ ] Camera access and permission handling
- [ ] Device compatibility detection (mobile/desktop)
- [ ] TensorFlow.js integration for object detection
- [ ] COCO-SSD model loading and inference
- [ ] Three.js AR overlay system
- [ ] TypeScript type definitions for all interfaces

###  Welcome & Onboarding
- [ ] Welcome step with device compatibility checks
- [ ] Camera permission request flow
- [ ] User onboarding instructions
- [ ] Error handling for unsupported devices
- [ ] Responsive design for mobile devices

###  Object Detection Steps
- [ ] **Find Computer Step Implementation**
  - Computer/laptop detection using COCO-SSD
  - Real-time AR overlays (arrows, bounding boxes)
  - Detection confidence feedback
  - Image capture functionality
- [ ] **Find Bottle Step Implementation**
  - Water bottle detection with visual feedback
  - AR labels and highlighting
  - Multiple object detection support
  - Success/failure state handling

###  Text Recognition
- [ ] **OCR Integration**
  - Tesseract.js integration for text recognition
  - Text detection and highlighting
  - Support for electrical panel labels
  - Model number and specification scanning
- [ ] **Scan Text Step Implementation**
  - Real-time text detection camera view
  - AR text highlighting overlays
  - Extracted text validation and cleanup
  - Manual text input fallback

###  Basic Measurements
- [ ] **AR Measurement Tools**
  - Virtual ruler overlay implementation
  - Point-to-point distance measurement
  - Grid overlay for spatial reference
  - Measurement unit conversion (metric/imperial)
- [ ] **Measure Space Step Implementation**
  - Interactive measurement placement
  - Multiple measurement support
  - Measurement history and editing
  - Visual measurement validation

###  Review & Data Collection
- [ ] **Review Step Enhancement**
  - Display all captured images
  - Show detected objects summary
  - Present extracted text data
  - Display measurements with visualizations
- [ ] **Data Export**
  - JSON data export functionality
  - Image compilation and compression
  - Basic PDF report generation
  - Local data cleanup options

###  Error Handling & UX
- [ ] **Robust Error Handling**
  - Camera access failures
  - Model loading errors
  - Detection timeout handling
  - Network connectivity issues
- [ ] **User Experience Enhancements**
  - Loading states for all async operations
  - Progress indicators during detection
  - Success/failure animations
  - Help tooltips and guidance

###  Basic Testing
- [ ] **Component Testing**
  - Unit tests for core utilities
  - Integration tests for survey flow
  - Camera and detection mocking
  - State management testing
- [ ] **Device Testing**
  - iOS Safari testing
  - Android Chrome testing
  - Various screen sizes validation
  - Performance benchmarking

## Success Criteria for MVP

1. **Core Flow Complete**: User can complete entire survey from welcome to review
2. **Object Detection Works**: Can reliably detect computers and bottles with AR overlays
3. **Text Recognition Functions**: Can extract text from electrical panels or equipment
4. **Basic Measurements**: Can measure simple distances using AR tools
5. **Data Persistence**: Survey data is saved and can be reviewed
6. **Mobile Optimized**: Works smoothly on mobile devices with good UX
7. **Error Resilient**: Handles common failure scenarios gracefully

## Technical Debt to Address in MVP

- [ ] Add comprehensive error boundaries
- [ ] Implement proper loading states
- [ ] Add input validation and sanitization
- [ ] Optimize model loading and caching
- [ ] Add basic analytics and logging
- [ ] Implement proper memory management for Three.js

## Target Users for MVP Testing

- **Internal Team**: Base Power developers and stakeholders
- **Beta Testers**: 5-10 friendly users with various devices
- **Focus**: Core functionality validation, not real energy assessments

## Estimated Timeline: 4-6 weeks

## Dependencies

- Camera API support in target browsers
- TensorFlow.js model availability
- Three.js WebGL support
- Local storage capabilities

---

**Next Phase**: Once MVP is complete and tested, proceed to [Phase 2: Beta](./02-beta.md) 