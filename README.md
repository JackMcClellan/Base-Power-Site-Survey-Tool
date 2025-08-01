# Base Power Site Survey Tool

An AI-powered mobile-first web application for capturing and analyzing electricity meter installations. The app guides users through capturing 12+ specific photo types, validates them with AI, extracts critical electrical data (amperage readings, model numbers), and securely stores everything in an AWS-backed infrastructure.

## Architecture Overview

```mermaid
graph TB
    A[Mobile Browser] --> B[Next.js Frontend]
    B --> C[Survey State Management]
    B --> D[Camera Capture Interface]
    D --> E[AI Validation & Analysis]
    E --> F[Next.js API Routes]
    F --> G[PostgreSQL Database]
    F --> H[AWS S3 Storage]
    F --> I[OpenAI Vision API]
    
    subgraph "AWS Infrastructure"
        G
        H
        J[IAM Roles]
    end
    
    subgraph "Data Flow"
        K[Survey UUID] --> G
        L[Survey Progress] --> G
        M[Photo Files] --> H
        N[AI Analysis Results] --> G
        O[Step Data] --> G
    end
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript | Server-side rendering, type safety |
| **UI** | Tailwind CSS 4, Radix UI, Lucide React | Mobile-first design system |
| **State** | Jotai | Atomic state management |
| **AI/ML** | OpenAI GPT-4o Vision | Photo validation and data extraction |
| **Backend** | Next.js API Routes | RESTful survey endpoints |
| **Database** | PostgreSQL with Prisma | Survey metadata and progress tracking |
| **Storage** | AWS S3 | Secure photo storage with presigned URLs |
| **Auth** | UUID-based access | Survey-specific secure access |
| **Infrastructure** | AWS (RDS, S3, IAM) | Scalable cloud architecture |
| **Build** | Turbopack | Fast development builds |

## Project Structure

```
base-power-site-survey-tool/
├── app/                    # Next.js 15 App Router
│   ├── api/               # REST API endpoints
│   │   ├── survey/        # Survey CRUD operations
│   │   ├── validate/      # AI validation endpoints
│   │   ├── upload/        # S3 presigned URL generation
│   │   └── images/        # Image retrieval with presigned URLs
│   └── survey/[uuid]/     # Dynamic survey pages
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI base components
│   ├── steps/            # Survey step components
│   ├── camera-view.tsx   # Full-screen camera interface
│   └── survey-flow.tsx   # Main survey orchestration
├── lib/                  # Core utilities and configurations
│   ├── survey-steps-config.ts # Complete survey flow definition
│   ├── database.ts       # Prisma database operations
│   ├── s3.ts            # AWS S3 upload/download helpers
│   └── ai-validation.ts  # OpenAI integration
├── hooks/                # Custom React hooks
│   ├── use-camera.ts     # Camera API management
│   └── use-survey-backend.ts # Survey state sync
├── atoms/                # Jotai state atoms
│   ├── camera.ts         # Camera stream state
│   └── survey.ts         # Survey flow state
├── prisma/               # Database schema and migrations
├── _docs/               # Project documentation
└── test_images/         # Test images for validation
```

## Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **pnpm**
- **AWS Account** with RDS and S3 access
- **OpenAI API Key** for photo validation

### Environment Variables

Create a `.env` file in the root directory:

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `AWS_REGION` | AWS region for RDS and S3 | `us-east-2` |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | `xyz123...` |
| `AWS_S3_BUCKET_NAME` | S3 bucket for photo storage | `base-power-survey-photos` |
| `OPENAI_API_KEY` | OpenAI API key for validation | `sk-proj-...` |

### Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Set up AWS Infrastructure**
   - Create PostgreSQL RDS instance
   - Create S3 bucket with private access
   - Configure IAM user with appropriate permissions
   - See [AWS Setup Guide](#-aws-setup-guide) below for detailed configuration

3. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000` (or `https://localhost:3000` for mobile testing).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build with Prisma generation |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint with Next.js rules |

## Security & Compliance

- **HTTPS Required** - Camera access enforced over secure connections only
- **UUID-based Access** - Secure survey identification without exposing sensitive data
- **Presigned URLs** - Temporary, secure access to S3 objects
- **Private S3 Storage** - No public read access to uploaded photos
- **Environment Secrets** - All credentials managed through environment variables
- **Input Validation** - Comprehensive validation using Zod schemas

## Deployment

### AWS Amplify (Recommended)

The project includes `amplify.yml` for AWS Amplify deployment and is optimized for the AWS ecosystem:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

1. **Connect your GitHub repository** to AWS Amplify
2. **Configure build settings** using the included `amplify.yml`
3. **Add environment variables** in the Amplify console
4. **Deploy** - automatic builds and deployments on push to main branch

Benefits of AWS Amplify deployment:
- **Seamless AWS integration** with RDS and S3 services
- **Automatic HTTPS** with custom domain support
- **Built-in CI/CD** with GitHub integration
- **Environment management** for staging and production
- **Cost optimization** within the AWS ecosystem

### Alternative: Vercel

For non-AWS environments:

1. **Connect repository** to Vercel
2. **Add environment variables** in project settings  
3. **Deploy** - automatic builds on push to main

## AWS Setup Guide

### S3 Bucket Configuration

1. **Create S3 Bucket**
   - Bucket name: `base-power-survey-photos` (or your chosen name)
   - Region: Match your RDS region
   - Block all public access: ✅ Enabled
   - Versioning: Optional

2. **Configure CORS for Presigned Uploads**
   
   In AWS Console → S3 → Your Bucket → Permissions → Cross-origin resource sharing (CORS):
   
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["PUT", "POST", "GET"],
           "AllowedOrigins": [
               "https://yourdomain.com",
               "https://your-vercel-app.vercel.app",
               "http://localhost:3000",
               "https://localhost:3000"
           ],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3600
       }
   ]
   ```
   
   **⚠️ Important:** Replace the URLs with your actual domain names.

### RDS PostgreSQL Configuration

1. **Create RDS Instance**
   - Engine: PostgreSQL 15+
   - Instance class: db.t3.micro (development) or db.t3.small (production)
   - Storage: 20 GB gp3 (encrypted recommended)
   - VPC: Default or custom with internet access
   - Security group: Allow port 5432 from application sources

2. **Security Group Configuration**
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: Your application's IP range or security group
   ```

### IAM User Setup

Create an IAM user with the following policy for S3 and RDS access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

## API Endpoints

### Survey Management
```http
POST /api/survey          # Create new survey
GET  /api/survey/[uuid]   # Get survey data
PUT  /api/survey/[uuid]   # Update survey progress
```

### Photo Upload & Validation
```http
POST /api/upload/presigned  # Get S3 presigned upload URL
POST /api/validate          # Submit photo for AI validation
GET  /api/images/[uuid]     # Get presigned download URLs
```

### Health Check
```http
GET /api/health            # Application health status
```

## Testing

The application includes comprehensive test image sets in the `test_images/` directory for validating AI analysis across all survey steps.

### Mobile Testing with HTTPS

Camera access requires HTTPS on mobile devices. Use one of these methods:

1. **ngrok** (recommended for development)
   ```bash
   npm run dev
   ngrok http 3000
   ```

2. **mkcert** for local HTTPS
   ```bash
   brew install mkcert
   mkcert -install
   mkcert localhost
   ```

[Back to top](#base-power-site-survey-tool)
