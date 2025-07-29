
# Vision Systems for Gauntlet AI: AR + AI Home Energy Site Survey Tool

This document provides a detailed guide on implementing the Augmented Reality (AR) and Computer Vision components for the Gauntlet AI tool as a web app using Next.js. It covers technologies, integration strategies, training requirements, and alternatives, based on the Product Requirements Document (PRD).

## Overview
The vision system combines web-based AR for spatial mapping and overlays with AI-driven computer vision for object detection and analysis. This enables users to scan homes via browser, identify energy-related features, and generate recommendations.

## Augmented Reality (AR) Implementation
AR in web apps leverages browser capabilities for accessibility.

### Technologies
- **WebXR API**: Standard for immersive web experiences, supporting AR on mobile browsers with camera access.
- **Three.js**: JavaScript library for 3D graphics, integrated with WebXR for rendering AR scenes.
- **A-Frame**: Web framework (built on three.js) for easy AR/VR content creation, using HTML-like syntax.
- **Next.js Integration**: Use dynamic imports or components to load AR scenes, ensuring compatibility with server-side rendering.

### How to Implement
1. **Setup**: Check for WebXR support in the browser; fallback to basic camera if unavailable.
2. **Features**:
   - **Session Management**: Start AR sessions to access camera and sensors.
   - **Hit Testing**: Detect real-world surfaces for measurements and virtual object placement.
   - **Overlays**: Display energy equipment models and annotations in the browser view.
3. **User Flow**: Web app requests camera access, enables AR mode, allows scanning and data capture.

### Training Requirements
No ML training for core AR; relies on browser APIs. Custom markers or image recognition may need training.

## Computer Vision Implementation
Vision processing can run client-side or server-side.

### Recommended Technologies
- **YOLO (You Only Look Once)**: For object detection. Train custom models and deploy via TensorFlow.js.
- **Roboflow**: For dataset curation and training YOLO models, exporting to formats suitable for web (e.g., TF.js).
- **TensorFlow.js**: Run models directly in the browser for real-time inference.

### How to Implement
1. **Dataset Preparation**:
   - Gather images of energy features.
   - Annotate and augment using Roboflow.
2. **Model Training**:
   - Train YOLO on Roboflow; convert to TensorFlow.js format.
3. **Integration**:
   - In Next.js, use TF.js to load and run models on canvas-captured frames.
   - For heavy computation, send images to server-side API (Node.js with TensorFlow).
4. **Real-time Detection**: Process video streams from getUserMedia for live analysis.

### Training Requirements
- **Yes, Training is Required**: Customize for energy-specific objects.
  - **Dataset Size**: 500-1000 images per class.
  - **Hardware**: Use cloud (Colab) for training; export for web.
  - **Metrics**: Target high mAP; optimize for browser performance.
  - **Ongoing**: Update with user data.

### Alternatives
- **MediaPipe**: Browser-native ML for tasks like object detection, no heavy setup.
- **ML5.js**: Simple wrapper over TF.js for easy integration.
- **Why YOLO + Roboflow?**: Accurate detection; Roboflow eases web deployment.

## Challenges and Best Practices
- **Browser Compatibility**: Test on Chrome/Android, Safari/iOS for WebXR.
- **Performance**: Use Web Workers for ML to avoid blocking UI.
- **Privacy**: Handle camera data securely; process on-client where possible.
- **Testing**: Use device emulators; validate in real browsing scenarios.

This web-based vision system aligns with Next.js for accessible energy surveys. 