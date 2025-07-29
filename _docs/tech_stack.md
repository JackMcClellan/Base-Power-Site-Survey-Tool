
# Tech Stack for Gauntlet AI: AR + AI Home Energy Site Survey Tool

Based on the Product Requirements Document (PRD) for the Gauntlet AI tool by Base Power Company, this document outlines the key technical components, their purposes, and how they are used in the system. Note: This is implemented as a web app using Next.js.

## Overview
The Gauntlet AI tool is a web-based application for conducting home energy site surveys, leveraging web AR and AI for assessments.

## Core Technologies

### Frontend / Web App
- **Next.js**: Framework for building the web application. Handles server-side rendering, API routes, and static generation. Used for the user interface, integrating AR via browser APIs, and displaying survey results.
- **React**: Core library for building interactive UIs within Next.js.

### Augmented Reality (AR)
- **WebXR API**: Browser-based AR for web apps. Enables immersive AR experiences on supported devices (e.g., mobile browsers with camera access).
- **Three.js or A-Frame**: Libraries for 3D rendering and AR scenes in the browser, integrated with WebXR for placing virtual objects and measurements.

### Artificial Intelligence (AI) / Machine Learning
- **Computer Vision Models**: Using TensorFlow.js for client-side inference or server-side with Node.js. Models process images for energy analysis.
- **AI Usage**: 
  - Analyze uploaded photos/scans to generate energy efficiency reports.
  - Provide recommendations for upgrades.
  - Server-side processing for complex models.

### Backend and Data Management
- **Node.js**: Integrated with Next.js for API routes, handling data processing and AI inferences.
- **Database**: PostgreSQL or MongoDB for storing survey data and results.
- **Cloud Services**: Vercel for hosting Next.js, or AWS for scalable backend and AI deployment.

### Integration and Tools
- **Typeform**: For forms and data collection, embedded or integrated via APIs.
- **Google Drive**: For sharing reports.
- **Authentication**: NextAuth.js for secure logins.

## System Architecture
- **Web Client**: Next.js app accesses device camera for AR, sends data to API routes.
- **Backend**: Next.js API processes requests, runs AI models, stores data.
- **AI Pipeline**: Images processed client-side (TensorFlow.js) or server-side.
- **Deployment**: Hosted on Vercel for seamless Next.js deployment.

## Security Considerations
- HTTPS for data in transit.
- Compliance with privacy laws.
- Secure handling of user-uploaded images.

This web-based tech stack enables accessible energy surveys via browsers. 